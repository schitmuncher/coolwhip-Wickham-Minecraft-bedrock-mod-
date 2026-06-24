import { world, system } from "@minecraft/server";

const SAP_BOILER_ID     = "cwickham:sap_boiler";
const SAP_TANK_ID       = "cwickham:sap_tank";
const SYRUP_TANK_ID     = "cwickham:syrup_tank";
const FILL_STATE        = "cwickham:fill_level";
const BOOSTED_STATE     = "cwickham:is_boosted";
const BURNT_CARAMEL_ID  = "cwickham:burnt_caramel";
const BUBBLE_SOUND      = "liquid.water";
const CARAMEL_CHANCE    = 0.10; // 10 % per successful boil cycle
const MAX_FILL          = 4;

/** Cardinal + vertical neighbour offsets */
const NEIGHBOURS = [
  {  x:  1, y: 0, z:  0 },
  {  x: -1, y: 0, z:  0 },
  {  x:  0, y: 0, z:  1 },
  {  x:  0, y: 0, z: -1 },
  {  x:  0, y: 1, z:  0 },
  {  x:  0, y: -1, z: 0 },
];

/**
 * Safely fetch a block at `pos` in `dimension`.
 * Returns the block or null if the chunk is unloaded or any error occurs.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} pos
 * @returns {import("@minecraft/server").Block | null}
 */
function safeGetBlock(dimension, pos) {
  try {
    return dimension.getBlock(pos) ?? null;
  } catch {
    return null;
  }
}

/**
 * Safely read a block-state value.
 * Returns the value, or null if the state key doesn't exist or any error occurs.
 * @param {import("@minecraft/server").BlockPermutation} permutation
 * @param {string} stateKey
 * @returns {number | boolean | string | null}
 */
function safeGetState(permutation, stateKey) {
  try {
    const value = permutation.getState(stateKey);
    return value ?? null;
  } catch {
    return null;
  }
}

/**
 * Safely apply a new permutation state to a block.
 * Returns true on success, false if the operation fails.
 * @param {import("@minecraft/server").Block} block
 * @param {import("@minecraft/server").BlockPermutation} permutation
 * @param {string} stateKey
 * @param {number | boolean | string} newValue
 * @returns {boolean}
 */
function safeSetState(block, permutation, stateKey, newValue) {
  try {
    block.setPermutation(permutation.withState(stateKey, newValue));
    return true;
  } catch {
    return false;
  }
}

/**
 * Scan adjacent blocks for the first one matching `targetId`.
 * Returns the matching block or null.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} origin
 * @param {string} targetId
 * @returns {import("@minecraft/server").Block | null}
 */
function findAdjacentBlock(dimension, origin, targetId) {
  for (const offset of NEIGHBOURS) {
    const pos = {
      x: origin.x + offset.x,
      y: origin.y + offset.y,
      z: origin.z + offset.z,
    };
    const block = safeGetBlock(dimension, pos);
    if (block && block.typeId === targetId) return block;
  }
  return null;
}

/**
 * Attempt one boil cycle: transfer `units` of sap → syrup.
 * Clamps to the available headroom in both tanks.
 * Returns the number of units actually transferred (0 if nothing happened).
 * @param {import("@minecraft/server").Block} sapTank
 * @param {import("@minecraft/server").Block} syrupTank
 * @param {number} units
 * @returns {number}
 */
function processBoilCycle(sapTank, syrupTank, units) {
  const sapPerm   = sapTank.permutation;
  const syrupPerm = syrupTank.permutation;

  const sapLevel   = safeGetState(sapPerm,   FILL_STATE);
  const syrupLevel = safeGetState(syrupPerm, FILL_STATE);

  if (typeof sapLevel   !== "number" || sapLevel   <= 0) return 0;
  if (typeof syrupLevel !== "number" || syrupLevel >= MAX_FILL) return 0;

  // Clamp to what is actually available / what fits
  const canDrain = sapLevel;
  const canFill  = MAX_FILL - syrupLevel;
  const actual   = Math.min(units, canDrain, canFill);
  if (actual <= 0) return 0;

  const drainOk = safeSetState(sapTank,   sapPerm,   FILL_STATE, sapLevel   - actual);
  const fillOk  = safeSetState(syrupTank, syrupPerm, FILL_STATE, syrupLevel + actual);

  return drainOk && fillOk ? actual : 0;
}

/**
 * Spawn a dropped item entity one block above `pos`.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} pos
 * @param {string} itemId
 */
function spawnItemAbove(dimension, pos, itemId) {
  try {
    const spawnPos = { x: pos.x + 0.5, y: pos.y + 1.2, z: pos.z + 0.5 };
    dimension.spawnItem(
      new (/** @type {any} */ (world).constructor.ItemStack ?? Object)(itemId, 1),
      spawnPos
    );
  } catch {
    // spawnItem requires an ItemStack; fall back to a command if the API call fails
    try {
      dimension.runCommand(
        `summon item ${pos.x + 0.5} ${pos.y + 1} ${pos.z + 0.5} {"item":{"id":"${itemId}","Count":1}}`
      );
    } catch {
      // If both approaches fail, silently skip rather than crashing
    }
  }
}

/**
 * Main automation tick — runs every 40 game ticks (2 seconds).
 * Scans blocks near online players for sap boilers and processes fluid transfers.
 */
system.runInterval(() => {
  const DIMENSIONS = ["overworld", "nether", "the_end"];

  for (const dimId of DIMENSIONS) {
    let dimension;
    try {
      dimension = world.getDimension(dimId);
    } catch {
      continue; // Dimension not loaded (e.g. nether disabled)
    }

    let players;
    try {
      players = dimension.getPlayers();
    } catch {
      continue;
    }
    if (!players || players.length === 0) continue;

    // De-duplicate positions so we don't process the same boiler twice when
    // multiple players are nearby.
    const checkedKeys = new Set();
    const SCAN_RADIUS = 32;

    for (const player of players) {
      let origin;
      try {
        origin = player.location;
      } catch {
        continue;
      }

      for (let dx = -SCAN_RADIUS; dx <= SCAN_RADIUS; dx++) {
        for (let dy = -SCAN_RADIUS; dy <= SCAN_RADIUS; dy++) {
          for (let dz = -SCAN_RADIUS; dz <= SCAN_RADIUS; dz++) {
            const pos = {
              x: Math.floor(origin.x) + dx,
              y: Math.floor(origin.y) + dy,
              z: Math.floor(origin.z) + dz,
            };

            const key = `${dimId}:${pos.x},${pos.y},${pos.z}`;
            if (checkedKeys.has(key)) continue;
            checkedKeys.add(key);

            // ── Locate a sap boiler ──────────────────────────────────────
            const boiler = safeGetBlock(dimension, pos);
            if (!boiler || boiler.typeId !== SAP_BOILER_ID) continue;

            // ── Read boosted state ────────────────────────────────────────
            let isBoosted = false;
            try {
              const boostedVal = safeGetState(boiler.permutation, BOOSTED_STATE);
              isBoosted = boostedVal === true;
            } catch {
              // State may not exist on older placed blocks; treat as unboosted
            }

            // Boosted boilers process 2 units per cycle; normal ones process 1
            const unitsToProcess = isBoosted ? 2 : 1;

            // ── Find adjacent tanks ───────────────────────────────────────
            const sapTank   = findAdjacentBlock(dimension, pos, SAP_TANK_ID);
            const syrupTank = findAdjacentBlock(dimension, pos, SYRUP_TANK_ID);
            if (!sapTank || !syrupTank) continue;

            // ── Process the boil cycle ────────────────────────────────────
            const transferred = processBoilCycle(sapTank, syrupTank, unitsToProcess);
            if (transferred <= 0) continue;

            // ── If boosted, clear the boost flag after processing ─────────
            if (isBoosted) {
              safeSetState(boiler, boiler.permutation, BOOSTED_STATE, false);
            }

            // ── Play bubbling sound ───────────────────────────────────────
            try {
              dimension.playSound(BUBBLE_SOUND, pos, { volume: 0.8, pitch: isBoosted ? 1.6 : 1.2 });
            } catch {
              // Non-critical; ignore sound failures
            }

            // ── 10 % chance to spawn burnt caramel above the boiler ───────
            if (Math.random() < CARAMEL_CHANCE) {
              spawnItemAbove(dimension, pos, BURNT_CARAMEL_ID);
            }
          }
        }
      }
    }
  }
}, 40);


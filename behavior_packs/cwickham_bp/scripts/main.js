import { world, system } from "@minecraft/server";

const SAP_BOILER_ID    = "cwickham:sap_boiler";
const SAP_TANK_ID      = "cwickham:sap_tank";
const SYRUP_TANK_ID    = "cwickham:syrup_tank";
const FILL_STATE       = "cwickham:fill_level";
const BUBBLE_SOUND     = "liquid.water"; // closest vanilla ambient sound; swap for a custom sound if desired

/** Cardinal neighbour offsets */
const NEIGHBOURS = [
  {  x:  1, y: 0, z:  0 },
  {  x: -1, y: 0, z:  0 },
  {  x:  0, y: 0, z:  1 },
  {  x:  0, y: 0, z: -1 },
  {  x:  0, y: 1, z:  0 },
  {  x:  0, y: -1, z: 0 },
];

/**
 * Try to find an adjacent block matching `targetId`.
 * Returns the first matching block or undefined.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} origin
 * @param {string} targetId
 */
function findAdjacentBlock(dimension, origin, targetId) {
  for (const offset of NEIGHBOURS) {
    const pos = {
      x: origin.x + offset.x,
      y: origin.y + offset.y,
      z: origin.z + offset.z,
    };
    try {
      const block = dimension.getBlock(pos);
      if (block && block.typeId === targetId) return block;
    } catch {
      // Block is in an unloaded chunk; skip silently
    }
  }
  return undefined;
}

/**
 * Main automation tick — runs every 40 game ticks (2 seconds).
 * Iterates over all loaded chunks in all dimensions looking for sap boilers.
 */
system.runInterval(() => {
  for (const dimension of [
    world.getDimension("overworld"),
    world.getDimension("nether"),
    world.getDimension("the_end"),
  ]) {
    /** @type {import("@minecraft/server").Entity[]} */
    // We use entities as location anchors to find nearby blocks efficiently.
    // For a small pack we scan near players; a large-scale scan would use a
    // custom structure or entity tracker instead.
    const players = dimension.getPlayers();
    if (players.length === 0) continue;

    // Collect unique boiler locations near any online player (within 32 blocks).
    const checkedKeys = new Set();

    for (const player of players) {
      const origin = player.location;
      const SCAN_RADIUS = 32;

      for (let dx = -SCAN_RADIUS; dx <= SCAN_RADIUS; dx++) {
        for (let dy = -SCAN_RADIUS; dy <= SCAN_RADIUS; dy++) {
          for (let dz = -SCAN_RADIUS; dz <= SCAN_RADIUS; dz++) {
            const pos = {
              x: Math.floor(origin.x) + dx,
              y: Math.floor(origin.y) + dy,
              z: Math.floor(origin.z) + dz,
            };
            const key = `${dimension.id}:${pos.x},${pos.y},${pos.z}`;
            if (checkedKeys.has(key)) continue;
            checkedKeys.add(key);

            let boiler;
            try {
              boiler = dimension.getBlock(pos);
            } catch {
              continue;
            }
            if (!boiler || boiler.typeId !== SAP_BOILER_ID) continue;

            // Found a boiler — look for an adjacent sap_tank with fill_level > 0
            const sapTank = findAdjacentBlock(dimension, pos, SAP_TANK_ID);
            if (!sapTank) continue;

            const sapPermutation = sapTank.permutation;
            const sapLevel = sapPermutation.getState(FILL_STATE);
            if (typeof sapLevel !== "number" || sapLevel <= 0) continue;

            // …and an adjacent syrup_tank with fill_level < 4
            const syrupTank = findAdjacentBlock(dimension, pos, SYRUP_TANK_ID);
            if (!syrupTank) continue;

            const syrupPermutation = syrupTank.permutation;
            const syrupLevel = syrupPermutation.getState(FILL_STATE);
            if (typeof syrupLevel !== "number" || syrupLevel >= 4) continue;

            // Process: decrement sap, increment syrup
            sapTank.setPermutation(
              sapPermutation.withState(FILL_STATE, sapLevel - 1)
            );
            syrupTank.setPermutation(
              syrupPermutation.withState(FILL_STATE, syrupLevel + 1)
            );

            // Play a bubbling/processing sound at the boiler location
            dimension.playSound(BUBBLE_SOUND, pos, {
              volume: 0.8,
              pitch: 1.2,
            });
          }
        }
      }
    }
  }
}, 40);

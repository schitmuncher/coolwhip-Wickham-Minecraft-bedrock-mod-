# Coolwhip Wickham — Minecraft Bedrock Add-on

A full custom Behavior Pack + Resource Pack for Minecraft Bedrock Edition (format_version **1.20.80+**).  
Namespace: **`cwickham:`**

---

## Table of Contents
1. [Pack Structure](#pack-structure)
2. [Installation](#installation)
3. [Items](#items)
4. [Blocks](#blocks)
5. [Crafting Recipes](#crafting-recipes)
6. [Custom Entity — Coolwhip Wickham](#custom-entity--coolwhip-wickham)
7. [Trade Table](#trade-table)
8. [Industrial Fluid System](#industrial-fluid-system)
9. [Automation Script](#automation-script)
10. [Resource Pack](#resource-pack)
11. [Adding Textures](#adding-textures)
12. [Known Limitations & Notes](#known-limitations--notes)
13. [3D Custom Geometry](#3d-custom-geometry)
14. [Natural World Spawning](#natural-world-spawning)

---

## Pack Structure

```
coolwhip-Wickham-Minecraft-bedrock-mod-/
├── behavior_packs/
│   └── cwickham_bp/
│       ├── manifest.json
│       ├── blocks/
│       │   ├── placed_pint.json
│       │   ├── pub_bench.json
│       │   ├── sap_boiler.json
│       │   ├── sap_pipe.json
│       │   ├── sap_tank.json
│       │   ├── syrup_tank.json
│       │   └── tree_tap.json
│       ├── entities/
│       │   └── coolwhip_wickham.json
│       ├── items/
│       │   ├── burnt_caramel.json
│       │   ├── butter.json
│       │   ├── coolwhip.json
│       │   ├── cream.json
│       │   ├── cwickham_surprise.json
│       │   ├── sap_bucket.json
│       │   ├── syrup.json
│       │   └── whip.json
│       ├── loot_tables/
│       │   └── syrup_from_log.json
│       ├── recipes/
│       │   ├── recipe_coolwhip.json
│       │   └── recipe_cwickham_surprise.json
│       ├── scripts/
│       │   └── main.js
│       ├── spawn_rules/
│       │   └── coolwhip_wickham.json
│       └── trading/
│           └── coolwhip_wickham_trades.json
└── resource_packs/
    └── cwickham_rp/
        ├── blocks.json
        ├── manifest.json
        ├── client_entity/
        │   └── coolwhip_wickham.json
        ├── models/
        │   └── blocks/
        │       └── placed_pint.geo.json
        ├── texts/
        │   └── en_US.lang
        └── textures/
            ├── item_texture.json
            ├── terrain_texture.json
            └── items/          ← place your PNGs here
```

---

## Installation

1. Copy `behavior_packs/cwickham_bp` into your Minecraft `behavior_packs` folder.
2. Copy `resource_packs/cwickham_rp` into your Minecraft `resource_packs` folder.
3. Add the textures listed in [Adding Textures](#adding-textures).
4. Create or open a world, go to **Add-Ons**, and activate both packs.
5. The world **must have cheats enabled** (or operator permissions) because several block events use `/give` and `/clear` commands internally.
6. **Experimental toggles required:** Enable *"Beta APIs"* (for the `@minecraft/server` scripting module used in `scripts/main.js`).

---

## Items

### `cwickham:butter`
| Property | Value |
|---|---|
| Stack size | 64 |
| Category | Items |
| Edible | ✅ Yes |
| Nutrition | 2 |
| Saturation | Low |
| Effects on eat | Speed II (10 s), Nausea I (5 s) |

Slippery going down. The speed is real; the stomach consequences are also real.

---

### `cwickham:cream`
| Property | Value |
|---|---|
| Stack size | 64 |
| Category | Items |

A basic ingredient obtained by processing a Milk Bucket in the Sap Boiler. Used in future crafting.

---

### `cwickham:syrup`
| Property | Value |
|---|---|
| Stack size | 64 |
| Category | Items |
| Drinkable | ✅ Yes (honey-bottle animation) |
| Nutrition | 0 |
| Saturation | Poor |
| Can always eat | ✅ Yes |
| Effects on drink | Speed III (15 s) |

Pure liquid speed. Zero food value, maximum legs.

---

### `cwickham:whip`
| Property | Value |
|---|---|
| Stack size | 1 |
| Category | Equipment |
| Durability | 100 uses |
| Hand-equipped | ✅ Yes |
| Attack damage | 3 |
| Special | Weapon component (on-hit logic) |

A tool and a weapon. Used as a crafting ingredient for Coolwhip and as an **overdrive tool** on the Sap Boiler (see Blocks). Each use as a boiler overdrive consumes 1 durability.

---

### `cwickham:coolwhip`
| Property | Value |
|---|---|
| Stack size | 64 |
| Category | Food |
| Nutrition | 4 |
| Saturation modifier | Normal |

Light and fluffy. Crafted by whipping a Milk Bucket. An essential ingredient in the CWickham Surprise.

---

### `cwickham:cwickham_surprise`
| Property | Value |
|---|---|
| Stack size | 64 |
| Category | Food |
| Nutrition | 4 |
| Saturation | Supernatural |
| Can always eat | ✅ Yes |
| Effects | Regeneration II (20 s), Absorption IV (120 s), Resistance I (300 s), Fire Resistance I (300 s) |

Nutritionally equivalent to an **Enchanted Golden Apple**. The surprise is that it's made of beef, syrup, and whipped cream.

---

### `cwickham:sap_bucket`
| Property | Value |
|---|---|
| Stack size | 1 |
| Category | Items |

A bucket filled with raw tree sap. Obtained by right-clicking a **Tree Tap** with an empty bucket. Used to fill a **Sap Tank**.

---

### `cwickham:burnt_caramel`
| Property | Value |
|---|---|
| Stack size | 64 |
| Category | Items |
| Fuel duration | 2400 ticks (same as a Dried Kelp Block) |

A byproduct of the boiling process — has a **10% chance** to drop on top of the Sap Boiler every time a successful boil cycle completes. Can be used as furnace fuel. Can also be traded to Coolwhip Wickham for diamonds (see Trade Table).

---

## Blocks

### `cwickham:sap_boiler`
The central workstation of the mod.

**States:**
| State | Type | Values |
|---|---|---|
| `cwickham:is_boosted` | Boolean | `false` (default), `true` |

**Interactions (right-click with):**

| Item in hand | Effect |
|---|---|
| Any log or sapling | Gives player 1× `cwickham:syrup` |
| `minecraft:milk_bucket` | Consumes bucket, gives player 1× `cwickham:cream` + 1× empty `minecraft:bucket` |
| `cwickham:whip` | Triggers `cwickham:manual_tick` event (gives player 1× `cwickham:syrup`), uses 1 whip durability |
| `minecraft:redstone_block` | Consumes the block, sets `cwickham:is_boosted = true` on the boiler |

**Boosted mode:** When `is_boosted` is `true`, the automation script processes **2 units** of sap → syrup per cycle instead of 1, then resets the flag back to `false`.

**Material:** Stone-equivalent. 3 s to mine, explosion resistance 6.

---

### `cwickham:tree_tap`
A directional block that you attach to the side of a log to harvest sap.

**States:**
| State | Values |
|---|---|
| `cwickham:facing_direction` | `north`, `south`, `east`, `west` |

Permutations rotate the block to face correctly depending on which face it's placed on.

**Interaction:** Right-click with an **empty bucket** → consumes the bucket, gives 1× `cwickham:sap_bucket`.

---

### `cwickham:sap_pipe`
A decorative full block for visually connecting machines. No functional logic — purely cosmetic.

---

### `cwickham:sap_tank`
Stores raw sap. Filled by the player using `cwickham:sap_bucket`. Drained automatically by the Sap Boiler script.

**States:**
| State | Type | Range |
|---|---|---|
| `cwickham:fill_level` | Integer | 0 – 4 |

**Display names by level:**
- 0 → `Sap Tank (Empty)`
- 1 → `Sap Tank (25% Full)`
- 2 → `Sap Tank (50% Full)`
- 3 → `Sap Tank (75% Full)`
- 4 → `Sap Tank (100% Full)`

**Interaction:** Right-click with `cwickham:sap_bucket` when fill_level < 4 → consumes the bucket, increments fill_level by 1.

---

### `cwickham:syrup_tank`
Stores processed syrup. Filled automatically by the Sap Boiler script. Drained by the player using a glass bottle.

**States:** Same `cwickham:fill_level` (0–4) as the Sap Tank.

**Display names by level:**
- 0 → `Syrup Tank (Empty)`
- 1 → `Syrup Tank (25% Full)`
- …up to `Syrup Tank (100% Full)`

**Interaction:** Right-click with `minecraft:glass_bottle` when fill_level > 0 → consumes the bottle, decrements fill_level by 1, gives player 1× `cwickham:syrup`.

---

### `cwickham:placed_pint`
A small decorative 3D pint-glass block placed in the world when Wickham's Brew is used on a surface. Uses a custom bone-rigged geometry model.

**3D Model:** `geometry.placed_pint` (see [3D Custom Geometry](#3d-custom-geometry))

**Collision / Selection box:** 4×6×4 units, sitting on the block floor.

**Interaction:** Right-click with anything → picks up the pint and returns 1× `cwickham:wickham_brew` to inventory.

> The pint is non-stackable as a placed object; picking it up restores the brew item.

---

### `cwickham:pub_bench`
A decorative wooden bench for pub interiors. Exactly **half a block tall**, functioning as a solid bottom-slab shape players can step onto.

| Property | Value |
|---|---|
| Material | Wood |
| Destroy time | 2.0 s |
| Explosion resistance | 3.0 |
| Height | 8/16 units (half block) |
| Category | Construction |
| Flammable | ✅ Yes |

Pairs naturally with `cwickham:placed_pint` for pub-themed builds. Supply `textures/blocks/pub_bench.png` (16×16 PNG) to texture it.

---

## Crafting Recipes

### Coolwhip (`cwickham:recipe_coolwhip`)
**Type:** Shapeless — Crafting Table

| Ingredient | Qty |
|---|---|
| `minecraft:milk_bucket` | 1 |
| `cwickham:whip` | 1 |

**Result:** 1× `cwickham:coolwhip`

> The whip is consumed (1 durability used per craft). After 100 crafts it breaks.

---

### CWickham Surprise (`cwickham:recipe_cwickham_surprise`)
**Type:** Shapeless — Crafting Table

| Ingredient | Qty |
|---|---|
| `minecraft:cooked_beef` | 1 |
| `cwickham:syrup` | 1 |
| `cwickham:coolwhip` | 1 |

**Result:** 1× `cwickham:cwickham_surprise`

---

## Custom Entity — Coolwhip Wickham

**Identifier:** `cwickham:coolwhip_wickham`  
**Spawnable:** Yes (spawn egg: green body, wheat overlay)  
**Health:** 20 HP  

Coolwhip Wickham is a custom villager-type entity. He walks around, looks at players, and opens a trading UI when right-clicked. His behaviors use vanilla villager locomotion and animation:

- `animation.villager.move` — walking
- `animation.common.look_at_target` — head tracking
- `animation.villager.inspect_mob_hand` — hand inspect animation while trading

He renders using the vanilla `geometry.villager.v2` skeleton and the `controller.render.villager_v2_masked` render controller. His texture is loaded from `textures/entity/villager/coolwhip_wickham.png` in the Resource Pack.

---

## Trade Table

**File:** `trading/coolwhip_wickham_trades.json`

| Tier | Wickham Wants | Wickham Gives | Max Uses |
|---|---|---|---|
| 1 | 1× `cwickham:butter` | 1× `minecraft:emerald` | 16 |
| 2 | 64× `minecraft:dirt` | 1× `cwickham:cwickham_surprise` | 8 |
| 3 | 5× `cwickham:burnt_caramel` | 3× `minecraft:diamond` | 4 |

Tier 3 is the rare deal — burn enough caramel and Wickham turns it into diamonds. Nobody ask questions.

---

## Industrial Fluid System

The mod includes a multi-block industrial pipeline for automating syrup production:

```
[Tree Tap] → (sap_bucket) → [Sap Tank] → (script) → [Sap Boiler] → [Syrup Tank] → (glass bottle) → syrup
```

**Step-by-step:**
1. Place a **Tree Tap** on any log face.
2. Right-click it with an empty bucket to get a **Sap Bucket**.
3. Right-click a **Sap Tank** with the Sap Bucket to fill it (up to level 4).
4. Place a **Sap Boiler** adjacent to the Sap Tank and a **Syrup Tank** adjacent to the boiler.
5. The automation script (running every 2 seconds) will automatically transfer sap → syrup.
6. Right-click the **Syrup Tank** with a glass bottle to extract **Syrup**.
7. Optionally right-click the **Sap Boiler** with a **Redstone Block** to boost it (processes 2 units next cycle).
8. Connect machines visually with **Sap Pipe** blocks.

---

## Automation Script

**File:** `scripts/main.js`  
**Engine:** `@minecraft/server` v1.12.0  
**Tick rate:** Every 40 ticks (2 seconds)

The script scans all blocks within **32 blocks** of any online player across the Overworld, Nether, and The End. For each `cwickham:sap_boiler` found:

1. Checks adjacent blocks for a `cwickham:sap_tank` with `fill_level > 0`.
2. Checks adjacent blocks for a `cwickham:syrup_tank` with `fill_level < 4`.
3. If both are found, processes a boil cycle:
   - **Normal boiler:** transfers 1 unit of sap → syrup.
   - **Boosted boiler** (`is_boosted = true`): transfers 2 units, then resets the boost flag.
4. Plays a bubbling water sound (higher pitch when boosted).
5. **10% random chance** to spawn a `cwickham:burnt_caramel` item on top of the boiler.

**Error safety:** Every block access, state read, and state write is wrapped in `try/catch`. Null/missing states are handled gracefully. The script will never crash the game engine due to unloaded chunks or missing block state keys.

---

## Resource Pack

**Pack:** `cwickham_rp`

### Localization (`texts/en_US.lang`)
All custom items, blocks, and entities have clean English display names registered.

### Item Texture Atlas (`textures/item_texture.json`)
Maps these texture keys to PNG file paths:

| Key | File |
|---|---|
| `cwickham_butter` | `textures/items/cwickham_butter.png` |
| `cwickham_cream` | `textures/items/cwickham_cream.png` |
| `cwickham_syrup` | `textures/items/cwickham_syrup.png` |
| `cwickham_whip` | `textures/items/cwickham_whip.png` |
| `cwickham_coolwhip` | `textures/items/cwickham_coolwhip.png` |
| `cwickham_surprise` | `textures/items/cwickham_surprise.png` |
| `cwickham_sap_bucket` | `textures/items/cwickham_sap_bucket.png` |
| `cwickham_burnt_caramel` | `textures/items/cwickham_burnt_caramel.png` |

### Terrain Texture Atlas (`textures/terrain_texture.json`)
Maps the `sap_boiler` terrain key to `textures/blocks/sap_boiler.png`.

### Client Entity (`client_entity/coolwhip_wickham.json`)
Defines the full render setup for Coolwhip Wickham using vanilla villager geometry, materials, animations, and render controllers.

---

## Adding Textures

You must supply these PNG files yourself. Until they are present, items will show as magenta missing-texture icons and the entity will be magenta.

**Item textures** (16×16 PNG recommended):
```
resource_packs/cwickham_rp/textures/items/
  cwickham_butter.png
  cwickham_cream.png
  cwickham_syrup.png
  cwickham_whip.png
  cwickham_coolwhip.png
  cwickham_surprise.png
  cwickham_sap_bucket.png
  cwickham_burnt_caramel.png
```

**Block textures** (16×16 PNG):
```
resource_packs/cwickham_rp/textures/blocks/
  sap_boiler.png
  tree_tap.png
  sap_pipe.png
  sap_tank.png
  syrup_tank.png
  pub_bench.png
  placed_pint.png
```

**Entity texture** (128×64 PNG, matching villager v2 UV layout):
```
resource_packs/cwickham_rp/textures/entity/villager/
  coolwhip_wickham.png
```

---

## Known Limitations & Notes

- **Whip "return on craft" mechanic:** Bedrock Edition has no native "return item" component for crafting recipes. The whip is consumed normally (1 durability per craft). This is correct Bedrock behaviour.
- **`minecraft:on_interact` single-trigger:** Bedrock blocks only support one `minecraft:on_interact` component. Multiple interaction types are handled via a `sequence` event with per-step `condition` queries.
- **Script scan radius:** The automation script scans within 32 blocks of each player. Boilers placed further than 32 blocks from any player won't process until a player comes within range. This is intentional to avoid performance issues.
- **`spawnItem` API:** The burnt caramel spawn in the script uses `dimension.spawnItem()` with a fallback to a `/summon` command if the API call fails on older engine versions.
- **Experimental APIs:** The scripting module (`scripts/main.js`) requires the *"Beta APIs"* experimental toggle to be enabled in the world settings.
- **`placed_pint` placement:** The `cwickham:placed_pint` block is placed via the `cwickham:wickham_brew` item's `on_use` block-face interaction. It has no menu category (`none`) and cannot be obtained directly from the creative inventory.
- **Pub bench collision:** The pub bench uses an 8-unit-tall collision box (half block). Players can walk onto it directly from the ground. Jumping is not required.

---

## 3D Custom Geometry

**File:** `resource_packs/cwickham_rp/models/blocks/placed_pint.geo.json`  
**Identifier:** `geometry.placed_pint`  
**Format version:** `1.12.0`

The placed pint is the first block in the mod to use a **custom 3D bone-rigged model** instead of a full block. It consists of three bones:

| Bone | Description | Origin | Size |
|---|---|---|---|
| `pint_base` | Narrow flat base of the glass | [-1.5, 0, -1.5] | [3, 1, 3] |
| `pint_body` | Main cylindrical body | [-2, 1, -2] | [4, 4, 4] |
| `pint_rim` | Slightly flared top rim | [-2, 5, -2] | [4, 1, 4] |

The total model stands **6 units tall** (6/16 of a full block) and is centred on the block floor. The texture atlas uses a 16×16 texture sheet (`placed_pint.png`) with UV coordinates packed to fit all three cubes.

The geometry is referenced in:
- `behavior_packs/cwickham_bp/blocks/placed_pint.json` → `"minecraft:geometry": { "identifier": "geometry.placed_pint" }`
- `resource_packs/cwickham_rp/blocks.json` → `"cwickham:placed_pint": { ... }`

---

## Natural World Spawning

**File:** `behavior_packs/cwickham_bp/spawn_rules/coolwhip_wickham.json`

Coolwhip Wickham now spawns **naturally** in the world without a spawn egg. The spawn rules are:

| Property | Value |
|---|---|
| Biomes | `forest`, `taiga` |
| Surface spawn | ✅ Yes (surface only) |
| Light level | 7–15 (daytime surface) |
| Spawn weight | 5 (rare — comparable to a wandering trader) |
| Herd size | 1 (always alone) |
| Population pool | `ambient` |

He will be found wandering through forest and taiga biomes during the day, alone, like a mysterious purveyor of artisanal goods. His rarity (weight 5) makes encounters feel meaningful — you won't stumble across him every few minutes.

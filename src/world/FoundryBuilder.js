import { MagmaSentinel } from '../entities/MagmaSentinel.js';
import { BossIgnis } from '../entities/BossIgnis.js';

export class FoundryBuilder {
  static buildAll(scene, otherSisters) {
    const foundryGroundY = 2150;
    this.buildSlagFunnel(scene);
    this.buildSmeltingCrux(scene, foundryGroundY);
    this.buildMoltenVault(scene, foundryGroundY, otherSisters[1]);
    this.buildColossusForge(scene, foundryGroundY);
  }

  // =========================================================================
  // SUB-REGION: foundry_descent [The Slag Funnel]
  // =========================================================================
  static buildSlagFunnel(scene) {
    // Stepping descent chutes from Catacombs (y: 1700 down to 2150)
    scene.createPlatform(1640, 1720, 120, 'tile_foundry_plat');
    scene.createPlatform(1760, 1850, 120, 'tile_foundry_plat');
    scene.createPlatform(1640, 1980, 120, 'tile_foundry_plat');
    scene.createPlatform(1740, 2070, 120, 'tile_foundry_plat');

    // Overhead grapple rings to climb back up or swing across
    scene.createGrappleRing(1700, 1780);
    scene.createGrappleRing(1700, 1910);
    scene.createGrappleRing(1700, 2020);

    // Warm atmospheric torches
    scene.createTorch(1600, 1710);
    scene.createTorch(1800, 1840);

    // Sentinel guarding descent
    const sentinel = new MagmaSentinel(scene, 1720, 1950);
    scene.enemies.add(sentinel);
  }

  // =========================================================================
  // SUB-REGION: foundry_smelting_crux [The Smelting Crux]
  // =========================================================================
  static buildSmeltingCrux(scene, foundryGroundY) {
    // Ground runs and molten crucible pits
    scene.createPlatformRun(1400, 2050, foundryGroundY, 'tile_foundry_ground');
    scene.createPlatformRun(2350, 2800, foundryGroundY, 'tile_foundry_ground');

    // Bubbling Lava Hazards in pits
    scene.createLavaRun(2050, 2350, foundryGroundY);

    // Stepping Grates & Crumbling Platforms over Lava Pit 1
    scene.createPlatform(2120, 2050, 80, 'tile_foundry_plat');
    scene.createCrumblingPlatform(2190, 2000, 70);
    scene.createPlatform(2250, 1960, 80, 'tile_foundry_plat');

    // Foundry Astral Leyline Waypoint (x: 2360)
    scene.createLeylineStone('leyline_foundry', 2360, foundryGroundY - 32, 'The Smelting Crux', '#ea580c');

    // Phase 6.5: Smelter Blast Gate (Requires Smelter Valve Wheel OR Mona's Thermal Conduit Ignition)
    scene.createWall(2460, 1850, 24, 204, 'tile_foundry_ground');
    const blastGate = scene.createRelicDoor('door_foundry_crux', 'key_smelter', 2460, 2054, 'Smelter Blast Gate');
    scene.createThermalConduit(2280, 1940, blastGate);
    scene.createCrackedWall(2460, 2054); // 32x96 cracked wall behind gate

    // Overhead hanging chains & grapple rings
    scene.createGrappleRing(2180, 1880);
    scene.createGrappleRing(2560, 1860);

    // Sentinels
    const s1 = new MagmaSentinel(scene, 1850, foundryGroundY - 30);
    scene.enemies.add(s1);
    const s2 = new MagmaSentinel(scene, 2650, foundryGroundY - 30);
    scene.enemies.add(s2);
  }

  // =========================================================================
  // SUB-REGION: foundry_molten_vault [The Brimstone Bastion]
  // =========================================================================
  static buildMoltenVault(scene, foundryGroundY, sisterIdToRescue) {
    // Stepping Grates over Lava Pit 2 (x: 2800 to 3100)
    scene.createLavaRun(2800, 3100, foundryGroundY);
    scene.createPlatform(2880, 2050, 80, 'tile_foundry_plat');
    scene.createPlatform(3000, 1970, 80, 'tile_foundry_plat');

    // Vault Floor (x: 3100 to 3700)
    scene.createPlatformRun(3100, 3700, foundryGroundY, 'tile_foundry_ground');

    // Cracked Stone Wall 2 guarding Sister Vault
    scene.createWall(3350, 1850, 24, 204, 'tile_foundry_ground');
    scene.createCrackedWall(3350, 2054);

    // Molten Sister Vault (Chamber 2)
    scene.createPlatform(3420, 2100, 200, 'tile_foundry_plat');
    if (sisterIdToRescue) {
      scene.createImprisonedSister(sisterIdToRescue, 3500, 2050, 2);
    }

    // Soul orbs
    scene.spawnSoulOrbs(3520, 2050, 3);
  }

  // =========================================================================
  // SUB-REGION: foundry_colossus_forge [The Great Anvil]
  // =========================================================================
  static buildColossusForge(scene, foundryGroundY) {
    // Solid arena floor (x: 3700 to 4150)
    scene.createPlatformRun(3700, 4150, foundryGroundY, 'tile_foundry_ground');

    // Solid east boundary wall at x: 4150 (prevents leaking into Sanctum)
    scene.createWall(4150, 1680, 32, 520, 'tile_foundry_ground');

    // Raised fighting grates for dodging magma waves
    scene.createPlatform(3780, foundryGroundY - 90, 90, 'tile_foundry_plat');
    scene.createPlatform(4020, foundryGroundY - 90, 90, 'tile_foundry_plat');
    scene.createGrappleRing(3900, foundryGroundY - 170);

    // Spawn Boss: Ignis the Obsidian Colossus at x: 3950
    scene.bossIgnis = new BossIgnis(scene, 3950, foundryGroundY - 50);
    scene.enemies.add(scene.bossIgnis);
  }
}

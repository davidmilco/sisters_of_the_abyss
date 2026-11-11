import { StormHarpy } from '../entities/StormHarpy.js';
import { ShadowGargoyle } from '../entities/ShadowGargoyle.js';
import { BossZephyra } from '../entities/BossZephyra.js';

export class SpireBuilder {
  static buildAll(scene, otherSisters) {
    const spireBaseY = 1080;
    this.buildGrandStairs(scene);
    this.buildGrandArchives(scene, spireBaseY);
    this.buildCelestialObservatory(scene, otherSisters[2]);
    this.buildTempestPinnacle(scene);
  }

  // =========================================================================
  // SUB-REGION: spire_grand_stairs [The Ascendant Stair]
  // =========================================================================
  static buildGrandStairs(scene) {
    // Ascending stairs from Catacombs (y: 1550 up to 1080)
    scene.createPlatform(1820, 1500, 110, 'tile_platform');
    scene.createPlatform(1960, 1380, 110, 'tile_spire_plat');
    scene.createPlatform(1840, 1260, 110, 'tile_spire_plat');
    scene.createPlatform(1980, 1160, 110, 'tile_spire_plat');
    scene.createPlatform(2120, 1080, 140, 'tile_spire_plat'); // Spire entrance

    // Stairway Gargoyle
    const garg = new ShadowGargoyle(scene, 1900, 1320);
    scene.enemies.add(garg);
  }

  // =========================================================================
  // SUB-REGION: spire_grand_archives [The Grand Archives]
  // =========================================================================
  static buildGrandArchives(scene, spireBaseY) {
    // Base library ground
    scene.createPlatformRun(2200, 2500, spireBaseY, 'tile_spire_ground');
    scene.createPlatformRun(2700, 3300, spireBaseY, 'tile_spire_ground');
    scene.createSpikeRun(2500, 2700, spireBaseY);

    // Spire Astral Leyline Waypoint (x: 2800)
    scene.createLeylineStone('leyline_spire', 2800, spireBaseY - 32, 'The Grand Archives', '#818cf8');

    // Multi-tiered Cathedral Book Stacks (tile_library_stack)
    scene.createPlatform(2300, 920, 120, 'tile_library_stack');
    scene.createPlatform(2480, 780, 120, 'tile_library_stack');
    scene.createPlatform(2680, 640, 140, 'tile_library_stack');
    scene.createPlatform(2920, 520, 140, 'tile_library_stack');
    scene.createPlatform(3180, 420, 140, 'tile_library_stack');

    // Aerial grapple rings through the library stacks
    scene.createGrappleRing(2400, 700);
    scene.createGrappleRing(2800, 560);
    scene.createGrappleRing(3050, 440);

    // Phase 6.5: Ascending Elevator Platform & Smashable Iron Counterweight (Percy's Shield Bash)
    const elev = scene.createPlatform(3000, 700, 120, 'tile_spire_plat');
    scene.createIronCounterweight(2850, 520, elev);

    // Phase 6.5: Locked Sky Portcullis (Requires Grand Archives Seal Key)
    scene.createRelicDoor('door_spire_observatory', 'key_archives', 3350, spireBaseY - 96, 'Grand Archives Sky Portcullis');

    // Library Grimoire Guards
    const harpy = new StormHarpy(scene, 2600, 520);
    scene.enemies.add(harpy);
    const garg = new ShadowGargoyle(scene, 2950, 650);
    scene.enemies.add(garg);

    // Soul orbs hidden high in the library stacks
    scene.spawnSoulOrbs(2700, 580, 3);
  }

  // =========================================================================
  // SUB-REGION: spire_celestial_observatory [The Moonlit Spire]
  // =========================================================================
  static buildCelestialObservatory(scene, sisterIdToRescue) {
    // High Spire Parapets (x: 3400 to 4100, y: 150 to 750)
    scene.createPlatform(3400, 480, 140, 'tile_spire_plat');
    scene.createPlatform(3650, 420, 140, 'tile_spire_plat');

    // Sister Imprisonment Dais (Chamber 3) at x: 3950, y: 340
    scene.createPlatform(3880, 360, 220, 'tile_spire_plat');
    if (sisterIdToRescue) {
      scene.createImprisonedSister(sisterIdToRescue, 3950, 290, 3);
    }

    // Grapple rings
    scene.createGrappleRing(3520, 350);
    scene.createGrappleRing(3780, 320);

    // Observatory Harpy
    const harpy = new StormHarpy(scene, 3700, 380);
    scene.enemies.add(harpy);
  }

  // =========================================================================
  // SUB-REGION: spire_tempest_pinnacle [The Tempest Crown]
  // =========================================================================
  static buildTempestPinnacle(scene) {
    // Pinnacle Needle battle stages (x: 4050 to 4400, y: 0 to 650)
    scene.createPlatform(4120, 520, 120, 'tile_spire_plat');
    scene.createPlatform(4260, 400, 120, 'tile_spire_plat');
    scene.createPlatform(4120, 280, 140, 'tile_spire_plat');

    // High altitude grapple anchors for aerial dogfighting
    scene.createGrappleRing(4200, 200);
    scene.createGrappleRing(4320, 160);

    // Sky wall separating Spire from Sanctum (x: 4400)
    scene.createWall(4400, 0, 32, 1120, 'tile_spire_ground');

    // Spawn Boss: Zephyra Queen of the Tempest at x: 4240, y: 220
    scene.bossZephyra = new BossZephyra(scene, 4240, 220);
    scene.enemies.add(scene.bossZephyra);
  }
}

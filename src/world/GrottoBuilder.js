import { ArcaneWisp } from '../entities/ArcaneWisp.js';
import { SkeletonKnight } from '../entities/SkeletonKnight.js';
import { BossCaelith } from '../entities/BossCaelith.js';

export class GrottoBuilder {
  static buildAll(scene, otherSisters) {
    const grottoGroundY = 1050;
    this.buildMineralShaft(scene);
    this.buildPrismaticChasm(scene, grottoGroundY);
    this.buildCrystallineVault(scene, otherSisters[0]);
    this.buildWeaverSanctum(scene);
  }

  // =========================================================================
  // SUB-REGION: grotto_ascent [The Mineral Shaft]
  // =========================================================================
  static buildMineralShaft(scene) {
    // Vertical ascending fissure (x: 50 to 450, y: 950 to 1550)
    scene.createPlatform(140, 1450, 110, 'tile_platform');
    scene.createPlatform(260, 1340, 110, 'tile_platform');
    scene.createPlatform(130, 1230, 110, 'tile_crystal_plat');
    scene.createPlatform(250, 1130, 110, 'tile_crystal_plat');
    scene.createPlatform(140, 1040, 130, 'tile_crystal_plat'); // Entrance to Grotto floor

    // Wisps guarding the mineral well
    const wisp1 = new ArcaneWisp(scene, 180, 1380);
    scene.enemies.add(wisp1);
    const wisp2 = new ArcaneWisp(scene, 220, 1180);
    scene.enemies.add(wisp2);
  }

  // =========================================================================
  // SUB-REGION: grotto_prismatic_chasm [The Prismatic Chasm]
  // =========================================================================
  static buildPrismaticChasm(scene, grottoGroundY) {
    // West approach and east bank
    scene.createPlatformRun(320, 850, grottoGroundY, 'tile_crystal_ground');
    scene.createPlatformRun(1250, 1600, grottoGroundY, 'tile_crystal_ground');

    // Deep Crystal Abyss (x: 850 to 1250)
    scene.createSpikeRun(850, 1250, grottoGroundY + 40);
    // Phase 6.5: Crumbling Crystal Ledges over the Abyss
    scene.createCrumblingPlatform(950, grottoGroundY - 30, 80);
    scene.createCrumblingPlatform(1120, grottoGroundY - 50, 80);

    // Arcane Crystal Switch Pedestal that activates Spectral Light Bridge
    scene.createArcanePedestal(780, grottoGroundY - 32, { startX: 850, endX: 1250, y: grottoGroundY });

    // Grotto Astral Leyline Waypoint (x: 720)
    scene.createLeylineStone('leyline_grotto', 720, grottoGroundY - 32, 'The Prismatic Chasm', '#22d3ee');

    // Floating crystal stepping ledges
    scene.createPlatform(420, 920, 110, 'tile_crystal_plat');
    scene.createPlatform(580, 820, 120, 'tile_crystal_plat');
    scene.createPlatform(720, 720, 120, 'tile_crystal_plat');
    scene.createPlatform(1340, 920, 120, 'tile_crystal_plat');

    // Phase 6.5: Spawn Prism Core Key on the eastern crystal terrace across the spectral bridge
    scene.spawnRelicKey('key_prism', 1340, 870);

    // Wisps and crystal skeleton
    const wisp1 = new ArcaneWisp(scene, 500, 800);
    scene.enemies.add(wisp1);
    const wisp2 = new ArcaneWisp(scene, 1100, 680);
    scene.enemies.add(wisp2);
    const skel = new SkeletonKnight(scene, 1420, grottoGroundY - 30);
    scene.enemies.add(skel);
  }

  // =========================================================================
  // SUB-REGION: grotto_crystalline_vault [Crystalline Dais]
  // =========================================================================
  static buildCrystallineVault(scene, sisterIdToRescue) {
    // High Geode Floating Chamber (x: 1350 to 2100, y: 400 to 1000)
    scene.createPlatform(1520, 790, 140, 'tile_crystal_plat');
    scene.createPlatform(1600, 560, 220, 'tile_crystal_plat');

    // Phase 6.5: Prismatic Geode Portal (Requires Prism Core Key or Mona's Astral Ray)
    scene.createRelicDoor('door_grotto_vault', 'key_prism', 1480, 560 - 96, 'Prismatic Geode Portal');

    // Stepping platforms ascending from behind the portal up to Caelith's Weaver Sanctum
    scene.createPlatform(1440, 480, 110, 'tile_crystal_plat');
    scene.createPlatform(1510, 410, 110, 'tile_crystal_plat');
    scene.createGrappleRing(1480, 370);

    // Grapple rings for ascending into the high geode
    scene.createGrappleRing(1450, 680);
    scene.createGrappleRing(1560, 520);

    // Sister Imprisonment Dais (Chamber 1)
    if (sisterIdToRescue) {
      scene.createImprisonedSister(sisterIdToRescue, 1680, 510, 1);
    }

    // High chamber wisp guard
    const wisp = new ArcaneWisp(scene, 1750, 620);
    scene.enemies.add(wisp);
  }

  // =========================================================================
  // SUB-REGION: grotto_weaver_sanctum [Web of Starlight]
  // =========================================================================
  static buildWeaverSanctum(scene) {
    // High Starlight Chamber (x: 1350 to 2100, y: 0 to 400)
    // Arena ground (y: 340; open vertical entrance shaft from vault at x: 1400 to 1540)
    scene.createPlatformRun(1540, 2050, 340, 'tile_crystal_plat');

    // Floating battle spires
    scene.createPlatform(1480, 240, 80, 'tile_crystal_plat');
    scene.createPlatform(1680, 190, 90, 'tile_crystal_plat');
    scene.createPlatform(1880, 240, 80, 'tile_crystal_plat');

    // Grapple rings for airborne dodging
    scene.createGrappleRing(1580, 140);
    scene.createGrappleRing(1780, 140);

    // Spawn Boss: Caelith the Prismatic Weaver at x: 1720, y: 220
    scene.bossCaelith = new BossCaelith(scene, 1720, 220);
    scene.enemies.add(scene.bossCaelith);
  }
}

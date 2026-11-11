import { BossAbyssKnight } from '../entities/BossAbyssKnight.js';

export class SanctumBuilder {
  static buildAll(scene) {
    const hubGroundY = 1650;
    this.buildSanctumGauntlet(scene, hubGroundY);
    this.buildSanctumThrone(scene, hubGroundY);
  }

  // =========================================================================
  // SUB-REGION: sanctum_gauntlet [The Gauntlet of Trial]
  // =========================================================================
  static buildSanctumGauntlet(scene, hubGroundY) {
    scene.createPlatformRun(3950, 4040, hubGroundY, 'tile_stone');

    // 1. Percy's Aegis Bash Challenge: Heavy Cracked Void Wall
    scene.createWall(4040, hubGroundY - 180, 24, 84, 'tile_stone');
    scene.createCrackedWall(4040, hubGroundY - 96);
    scene.createPlatformRun(4064, 4110, hubGroundY, 'tile_stone');

    // 2. Mona's Astral Light Bridge Challenge: Void Spike Chasm (x: 4110 to 4240)
    scene.createSpikeRun(4110, 4240, hubGroundY + 30);
    scene.createArcanePedestal(4075, hubGroundY - 32, { startX: 4110, endX: 4240, y: hubGroundY });

    // 3. Tilly's Grapple Whip Challenge: Overhead Anchor Rings across Chasm (x: 4240 to 4330)
    scene.createPlatformRun(4240, 4270, hubGroundY, 'tile_stone');
    scene.createSpikeRun(4270, 4340, hubGroundY + 30);
    scene.createGrappleRing(4290, hubGroundY - 140);
    scene.createGrappleRing(4330, hubGroundY - 140);

    // 4. Wren's Zephyr Air Dash Challenge: Mid-air Dash to Barrier Threshold
    scene.createPlatform(4340, hubGroundY - 50, 50, 'tile_platform');
    scene.createSpikeRun(4350, 4390, hubGroundY + 30);
    scene.createPlatformRun(4390, 4400, hubGroundY, 'tile_stone');
  }

  // =========================================================================
  // SUB-REGION: sanctum_throne [The Void Throne Room]
  // =========================================================================
  static buildSanctumThrone(scene, sanctumGroundY) {
    const sanctumRoofY = 1120;

    // Solid Ground across the Sanctum
    scene.createPlatformRun(4200, 5400, sanctumGroundY, 'tile_stone');

    // Impenetrable Roof / Ceiling covering the entire Boss Chamber & Sanctum (y: 1120)
    scene.createPlatformRun(4400, 5400, sanctumRoofY, 'tile_stone');
    scene.createPlatformRun(4400, 5400, sanctumRoofY - 32, 'tile_stone');

    // Sealed Entrance Wall at x: 4400 (From roof y: 1120 down to top of barrier y: 1490)
    scene.createWall(4400, sanctumRoofY, 32, 1490 - sanctumRoofY, 'tile_stone');

    // The 4-Sister Sanctum Barrier Gate at x: 4400, y: 1490
    scene.createSanctumBarrier(4400, 1490);

    // Interior Boss Portcullis Archway at x: 4480
    scene.createWall(4480, sanctumRoofY, 32, 1530 - sanctumRoofY, 'tile_stone');

    // Boss Gate Portcullis at x: 4480 (slams shut when combat starts)
    scene.bossGate = scene.physics.add.staticGroup();

    // Raised fighting platforms and overhead grapple rings for Phase 2 Aerial Combat
    scene.createPlatform(4650, sanctumGroundY - 110, 120, 'tile_platform');
    scene.createPlatform(4820, sanctumGroundY - 180, 160, 'tile_platform'); // Elevated center battle stage
    scene.createPlatform(5050, sanctumGroundY - 110, 120, 'tile_platform');
    scene.createGrappleRing(4680, sanctumGroundY - 240);
    scene.createGrappleRing(4900, sanctumGroundY - 260);
    scene.createGrappleRing(5120, sanctumGroundY - 240);
    scene.createTorch(4550, sanctumGroundY - 80);
    scene.createTorch(4850, sanctumGroundY - 80);
    scene.createTorch(5150, sanctumGroundY - 80);

    // Spawn Climax Boss Malakor at x: 4900
    scene.boss = new BossAbyssKnight(scene, 4900, sanctumGroundY - 50);
    scene.enemies.add(scene.boss);
  }
}

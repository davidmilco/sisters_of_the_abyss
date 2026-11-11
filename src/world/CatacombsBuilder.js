import { SkeletonKnight } from '../entities/SkeletonKnight.js';
import { ShadowGargoyle } from '../entities/ShadowGargoyle.js';
import { BossOssian } from '../entities/BossOssian.js';

export class CatacombsBuilder {
  static buildAll(scene) {
    const hubGroundY = 1650;
    this.buildHaven(scene, hubGroundY);
    this.buildOssuary(scene, hubGroundY);
    this.buildOssuaryTrial(scene);
    this.buildPilgrimWay(scene, hubGroundY);
    this.buildWardenCrypt(scene, hubGroundY);
    this.buildSanctumApproach(scene, hubGroundY);
  }

  // =========================================================================
  // SUB-REGION: catacombs_haven [Sanctuary of Haven]
  // =========================================================================
  static buildHaven(scene, hubGroundY) {
    // Solid ground under sanctuary (x: 500 to 1250)
    scene.createPlatformRun(500, 950, hubGroundY, 'tile_stone');
    scene.createPlatformRun(1020, 1250, hubGroundY, 'tile_stone');
    scene.createSpikeRun(950, 1020, hubGroundY); // Small central spike pit

    // Bonfire Shrine in Haven (x: 800)
    scene.shrine = scene.physics.add.sprite(800, hubGroundY - 24, 'shrine_0').setDepth(4);
    scene.shrine.body.setAllowGravity(false);
    scene.shrine.body.setImmovable(true);

    const shrineGlow = scene.add.image(800, hubGroundY - 20, 'light_glow_cool')
      .setScale(1.7)
      .setAlpha(0.65)
      .setDepth(2);
    scene.tweens.add({
      targets: shrineGlow,
      scale: 2.0,
      alpha: 0.85,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.createTorch(740, hubGroundY - 80);
    scene.createTorch(860, hubGroundY - 80);

    // Haven Astral Leyline Waypoint (x: 640)
    scene.createLeylineStone('leyline_haven', 640, hubGroundY - 32, 'Sanctuary of Haven', '#38bdf8');

    // Platforms in Haven
    scene.createPlatform(600, hubGroundY - 80, 120, 'tile_platform');
    scene.createPlatform(780, hubGroundY - 140, 140, 'tile_platform');

    // Treasure chest
    scene.createPlatform(1150, hubGroundY - 70, 120, 'tile_platform');
    scene.chest = scene.physics.add.sprite(1200, hubGroundY - 95, 'chest');
    scene.chest.body.setAllowGravity(false);
    scene.chestOpened = false;
  }

  // =========================================================================
  // SUB-REGION: catacombs_ossuary [The Bone Ossuary]
  // =========================================================================
  static buildOssuary(scene, hubGroundY) {
    // West lower crypts (x: 150 to 500; x: 32 to 150 is the open vertical descent shaft down to the trial chamber)
    scene.createPlatformRun(150, 500, hubGroundY, 'tile_stone');

    // Raised burial tiers & ossuary ledges
    scene.createPlatform(80, hubGroundY - 90, 130, 'tile_platform');
    scene.createPlatform(260, hubGroundY - 160, 140, 'tile_platform');
    scene.createPlatform(100, hubGroundY - 230, 150, 'tile_platform');

    // Ossuary Enemies
    const skel1 = new SkeletonKnight(scene, 180, hubGroundY - 30);
    scene.enemies.add(skel1);
    const skel2 = new SkeletonKnight(scene, 320, hubGroundY - 180);
    scene.enemies.add(skel2);
    const garg1 = new ShadowGargoyle(scene, 220, hubGroundY - 260);
    scene.enemies.add(garg1);

    // One-way iron portcullis shortcut connecting Ossuary to Haven (x: 480)
    scene.createShortcutPortcullis('portcullis_ossuary', 480, hubGroundY - 96, 420, hubGroundY - 24);

    // Phase 6.5: Locked Ossuary Crypt Relic Door (Requires Ossuary Crypt Key)
    scene.createRelicDoor('door_ossuary_depths', 'key_ossuary', 150, hubGroundY - 96, 'Ossuary Crypt Gate');

    // Secret soul orbs on upper ledge
    scene.spawnSoulOrbs(120, hubGroundY - 260, 3);
  }

  // =========================================================================
  // SUB-REGION / CHAMBER: room_ossuary_trial [Ossuary Crypt Trial Chamber]
  // Lower level crypt beneath the Ossuary (y: 1750 to 2050)
  // =========================================================================
  static buildOssuaryTrial(scene) {
    const trialGroundY = 2020;
    // Solid ground floor for the Ossuary Trial arena
    scene.createPlatformRun(32, 500, trialGroundY, 'tile_stone');

    // Stepping descent platforms down western crypt fissure (x: 32 to 150, y: 1650 to 2020)
    scene.createPlatform(80, 1740, 100, 'tile_platform');
    scene.createPlatform(140, 1840, 90, 'tile_platform');
    scene.createPlatform(80, 1930, 100, 'tile_platform');

    // Grapple ring to easily climb back up the western shaft
    scene.createGrappleRing(100, 1780);
    scene.createGrappleRing(100, 1690);

    // Raised battle terraces in the trial chamber
    scene.createPlatform(180, trialGroundY - 70, 90, 'tile_platform');
    scene.createPlatform(340, trialGroundY - 70, 90, 'tile_platform');
    scene.createGrappleRing(260, trialGroundY - 140);

    // Torches
    scene.createTorch(80, trialGroundY - 60);
    scene.createTorch(440, trialGroundY - 60);
  }

  // =========================================================================
  // SUB-REGION: catacombs_pilgrim_way [The Pilgrim's Causeway]
  // =========================================================================
  static buildPilgrimWay(scene, hubGroundY) {
    // Grand East Viaduct (x: 1250 to 1580, then OPEN DESCENT CHUTE at 1580-1780 to Molten Foundry, then 1780 to 2550)
    scene.createPlatformRun(1250, 1580, hubGroundY, 'tile_stone');
    scene.createPlatformRun(1780, 1800, hubGroundY, 'tile_stone');
    scene.createPlatformRun(1900, 2550, hubGroundY, 'tile_stone');

    // Chasm 1 with crumbling stepping platforms
    scene.createSpikeRun(1800, 1900, hubGroundY + 20);
    scene.createCrumblingPlatform(1830, hubGroundY - 60, 64);

    // High Arched stone viaduct pillars across the Slag Funnel descent chute
    scene.createPlatform(1360, hubGroundY - 80, 110, 'tile_platform');
    scene.createPlatform(1520, hubGroundY - 150, 120, 'tile_platform');
    scene.createPlatform(1680, hubGroundY - 220, 140, 'tile_platform'); // Bridge across the descent
    scene.createPlatform(2100, hubGroundY - 90, 120, 'tile_platform');
    scene.createPlatform(2300, hubGroundY - 160, 130, 'tile_platform');

    // Overhead grapple rings for aerial momentum and climbing back up from the Foundry
    scene.createGrappleRing(1600, hubGroundY - 210);
    scene.createGrappleRing(1680, hubGroundY - 70); // Low ring to grapple out of the chute
    scene.createGrappleRing(2200, hubGroundY - 150);

    // Flanking torches marking the Slag Funnel descent
    scene.createTorch(1560, hubGroundY - 70);
    scene.createTorch(1800, hubGroundY - 70);

    // Causeway Enemies
    const garg1 = new ShadowGargoyle(scene, 1450, hubGroundY - 120);
    scene.enemies.add(garg1);
    const skel1 = new SkeletonKnight(scene, 2050, hubGroundY - 30);
    scene.enemies.add(skel1);
    const garg2 = new ShadowGargoyle(scene, 2400, hubGroundY - 200);
    scene.enemies.add(garg2);
  }

  // =========================================================================
  // SUB-REGION: catacombs_warden_crypt [Crypt of the Undying Warden]
  // =========================================================================
  static buildWardenCrypt(scene, hubGroundY) {
    // Arena ground (x: 2550 to 3400)
    scene.createPlatformRun(2550, 3400, hubGroundY, 'tile_stone');

    // Crypt chamber roof (y: 1350)
    scene.createPlatformRun(2600, 3350, 1350, 'tile_stone');

    // Entry pillar & cracked wall (Percy's Aegis Bash shortcut)
    scene.createWall(2600, 1350, 24, hubGroundY - 1350 - 96, 'tile_stone');
    scene.createCrackedWall(2600, hubGroundY - 96);

    // Exit gate to Sanctum approach (x: 3350)
    scene.createWall(3350, 1350, 24, hubGroundY - 1350 - 96, 'tile_stone');
    scene.cryptWardenGate = scene.platforms.create(3350, hubGroundY - 96, 'shortcut_portcullis');
    scene.cryptWardenGate.setOrigin(0, 0);
    scene.cryptWardenGate.refreshBody();

    // Raised battle terraces in Warden Arena
    scene.createPlatform(2750, hubGroundY - 80, 100, 'tile_platform');
    scene.createPlatform(3150, hubGroundY - 80, 100, 'tile_platform');
    scene.createGrappleRing(2950, hubGroundY - 160);

    // Torches
    scene.createTorch(2700, hubGroundY - 70);
    scene.createTorch(3250, hubGroundY - 70);

    // Spawn Regional Boss: Ossian, Crypt Warden at x: 2980
    scene.bossOssian = new BossOssian(scene, 2980, hubGroundY - 50);
    scene.enemies.add(scene.bossOssian);
  }

  // =========================================================================
  // SUB-REGION / CORRIDOR: The Void Threshold Viaduct (x: 3350 to 3950)
  // Seamlessly bridges the Catacombs Crypt to the Sanctum Gauntlet
  // =========================================================================
  static buildSanctumApproach(scene, hubGroundY) {
    // Grand Viaduct bridge from Warden Gate (x: 3350) across to Sanctum Gauntlet (x: 3950)
    scene.createPlatformRun(3350, 3950, hubGroundY, 'tile_stone');

    // Atmospheric gothic arched bridge terraces and columns
    scene.createPlatform(3480, hubGroundY - 80, 120, 'tile_platform');
    scene.createPlatform(3650, hubGroundY - 140, 140, 'tile_platform');
    scene.createPlatform(3820, hubGroundY - 80, 120, 'tile_platform');

    // Overhead grapple rings for aerial momentum
    scene.createGrappleRing(3540, hubGroundY - 180);
    scene.createGrappleRing(3720, hubGroundY - 210);

    // Guarding torches
    scene.createTorch(3420, hubGroundY - 70);
    scene.createTorch(3700, hubGroundY - 70);
    scene.createTorch(3900, hubGroundY - 70);

    // Void patrol gargoyles
    const garg1 = new ShadowGargoyle(scene, 3550, hubGroundY - 180);
    scene.enemies.add(garg1);
    const garg2 = new ShadowGargoyle(scene, 3800, hubGroundY - 180);
    scene.enemies.add(garg2);
  }
}

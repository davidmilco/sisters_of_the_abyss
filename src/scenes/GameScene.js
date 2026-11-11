import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { SkeletonKnight } from '../entities/SkeletonKnight.js';
import { ShadowGargoyle } from '../entities/ShadowGargoyle.js';
import { ArcaneWisp } from '../entities/ArcaneWisp.js';
import { MagmaSentinel } from '../entities/MagmaSentinel.js';
import { StormHarpy } from '../entities/StormHarpy.js';
import { BossAbyssKnight } from '../entities/BossAbyssKnight.js';
import { soundFX } from '../audio/SoundFX.js';
import { SISTERS_DATA } from '../utils/SisterSpriteGenerator.js';
import { SaveManager } from '../utils/SaveManager.js';
import { GamepadManager } from '../input/GamepadManager.js';
import { SubRegionManager } from '../world/SubRegionManager.js';
import { CatacombsBuilder } from '../world/CatacombsBuilder.js';
import { GrottoBuilder } from '../world/GrottoBuilder.js';
import { FoundryBuilder } from '../world/FoundryBuilder.js';
import { SpireBuilder } from '../world/SpireBuilder.js';
import { SanctumBuilder } from '../world/SanctumBuilder.js';
import { ASTRAL_LEYLINES, SUB_REGIONS, PRIMORDIAL_SIGILS, RELIC_KEYS } from '../world/WorldData.js';
import { RoomManager } from '../world/RoomManager.js';

export const SISTER_ABILITY_MAP = {
  wren: { key: 'dash', name: 'Zephyr Air Dash', hotkey: 'SHIFT (air)', desc: 'Mid-air dash across chasms and spikes' },
  percy: { key: 'shieldBash', name: 'Aegis Bash', hotkey: 'F or U', desc: 'Shield charge that shatters cracked walls' },
  mona: { key: 'astralRay', name: 'Astral Ray', hotkey: 'R or I', desc: 'Piercing beam that activates arcane crystals' },
  tilly: { key: 'grapple', name: 'Grapple Whip', hotkey: 'V or O', desc: 'Latches onto overhead rings to vault upward' },
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.touchControls = { left: false, right: false };
    this.sisterId = 'wren';
    this.currentBiome = 'catacombs';
    this.discoveredBiomes = new Set(['catacombs']);
    this.lastBiomeCheck = 0;
    this.savedData = null;
    this.gamepadManager = null;
    this.collectedSigils = new Set();
    this.collectedKeys = new Set();
    this.openedDoors = new Set();
    this.roomManager = null;
  }

  init(data) {
    if (data && data.sisterId) {
      this.sisterId = data.sisterId;
    }
    if (data && data.loadSavedGame && data.savedData) {
      this.savedData = data.savedData;
      this.sisterId = data.savedData.leadSisterId || this.sisterId;
      this.collectedSigils = new Set(data.savedData.collectedSigils || []);
      this.collectedKeys = new Set(data.savedData.collectedKeys || []);
      this.openedDoors = new Set(data.savedData.openedDoors || []);
    } else {
      this.savedData = null;
      this.collectedSigils = new Set();
      this.collectedKeys = new Set();
      this.openedDoors = new Set();
    }
    this.currentBiome = 'catacombs';
    this.discoveredBiomes = new Set(['catacombs']);
  }

  create() {
    // World bounds: 5400 px wide by 2500 px high (Interconnected Multi-Biome Metroidvania)
    const worldW = 5400;
    const worldH = 2500;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Setup Multi-Biome Parallax Backgrounds
    this.createParallaxBackground(worldW, worldH);

    // Platform and Hazard Groups
    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.soulOrbs = this.physics.add.group();
    this.playerBolts = this.physics.add.group();
    this.slashWaves = this.physics.add.group();
    this.enemyEmbers = this.physics.add.group();
    this.bossShockwaves = this.physics.add.group();
    this.enemies = this.add.group();

    // Metroidvania Exploration Groups
    this.crackedWalls = this.physics.add.staticGroup();
    this.grappleRings = this.add.group();
    this.arcanePedestals = this.physics.add.staticGroup();
    this.astralRays = this.physics.add.group();
    this.imprisonedSisters = [];
    this.sanctumBarrier = null;
    this.sanctumBarrierOpened = false;

    // Phase 4: Haven Campfire Hub & Ancient Keepsakes
    this.rescuedSisterIds = new Set();
    this.gatheredSisterSprites = {};
    this.keepsakes = this.physics.add.group();

    // Phase 8: Sub-Region Manager, Astral Leylines & Shortcut Portcullises
    this.subRegionManager = new SubRegionManager(this);
    this.subRegionManager.init(this.savedData ? this.savedData.discoveredSubRegions : []);
    this.leylines = [];
    this.discoveredLeylineIds = new Set(this.savedData && this.savedData.discoveredLeylineIds ? this.savedData.discoveredLeylineIds : ['leyline_haven']);
    this.shortcutPortcullises = [];

    // Phase 6.5: Discrete Chamber Room Manager, 4 Primordial Sigils & Relic Keys
    this.roomManager = new RoomManager(this);
    this.roomManager.init({
      discoveredRooms: this.savedData ? this.savedData.discoveredRooms : [],
      clearedTrials: this.savedData ? this.savedData.clearedTrials : [],
    });
    this.sigilPickups = this.physics.add.group();
    this.keyPickups = this.physics.add.group();
    this.relicDoors = this.physics.add.staticGroup();
    this.thermalConduits = this.physics.add.staticGroup();
    this.ironCounterweights = this.physics.add.staticGroup();
    this.crumblingPlatforms = [];
    this.bastionGate = null;
    this.bastionSockets = {};
    this.bastionGateOpened = false;

    // Set deep atmospheric camera background
    this.cameras.main.setBackgroundColor('#05040d');

    // Build Interconnected Multi-Biome Level Layout
    this.buildLevel(worldW, worldH);
    this.createAtmosphericParticles();

    // Spawn Player inside Catacombs Hub Sanctuary of Haven
    this.player = new Player(this, 740, 1580, this.sisterId);

    // Phase 4: Setup Campfire Haven ambient effects, prompts, and keepsakes
    this.setupCampfireHaven();
    this.spawnKeepsakes();

    // Camera follow with smooth lerp
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Input Keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      attackAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      cast: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      castAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      castQ: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      roll: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      rollAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      rollC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      interactB: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      interactEnter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      bash: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      bashAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
      ray: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      rayAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      grapple: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
      grappleAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
      parry: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      assist: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB),
      assistAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T),
    };

    // Setup Collisions
    this.setupCollisions();

    // Boss Chamber Trigger Area
    this.bossTriggered = false;

    // Phase 6: Gamepad Manager & Character Themes
    this.gamepadManager = new GamepadManager(this);
    soundFX.setLeadSister(this.sisterId);

    // Phase 6: Restore Saved Progress if loaded from save
    if (this.savedData) {
      if (this.savedData.playerX && this.savedData.playerY) {
        this.player.setPosition(this.savedData.playerX, this.savedData.playerY);
      }
      if (this.savedData.unlockedAbilities) {
        Object.assign(this.player.abilities, this.savedData.unlockedAbilities);
      }
      if (this.savedData.collectedKeepsakes) {
        this.savedData.collectedKeepsakes.forEach(k => this.player.collectedKeepsakes.add(k));
      }
      if (this.savedData.rescuedSisterIds) {
        this.savedData.rescuedSisterIds.forEach(id => this.rescuedSisterIds.add(id));
      }
      if (this.savedData.maxHealth) this.player.maxHealth = this.savedData.maxHealth;
      if (this.savedData.health) this.player.health = this.savedData.health;
      if (this.savedData.maxSoul) this.player.maxSoul = this.savedData.maxSoul;
      if (this.savedData.soul) this.player.soul = this.savedData.soul;

      this.updateCampfireSisters();
      this.time.delayedCall(100, () => {
        this.events.emit('health_changed', this.player.health, this.player.maxHealth);
        this.events.emit('soul_changed', this.player.soul, this.player.maxSoul);
        this.events.emit('ability_unlocked', 'all', this.player.abilities);
      });
    }

    // Phase 4 & 6: Listen for Campfire Haven UI requests & Auto-save
    this.events.on('request_rest_campfire', () => {
      this.player.restAtShrine(this.shrine.x, this.shrine.y);
      this.saveProgress();
    });

    this.events.on('request_sister_swap', (newSisterId) => {
      this.rescuedSisterIds.add(this.player.sisterId);
      this.player.swapSister(newSisterId);
      this.updateCampfireSisters();
      soundFX.setLeadSister(newSisterId);
      soundFX.playSisterTheme(newSisterId);
      this.saveProgress();
    });

    // Phase 8: Listen for Leyline Fast-Travel teleport requests
    this.events.on('teleport_to_leyline', (leylineId) => {
      this.teleportToLeyline(leylineId);
    });
  }

  saveProgress() {
    const success = SaveManager.saveGame({
      leadSisterId: this.player.sisterId,
      rescuedSisterIds: Array.from(this.rescuedSisterIds),
      unlockedAbilities: this.player.abilities,
      collectedKeepsakes: Array.from(this.player.collectedKeepsakes),
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      soul: this.player.soul,
      maxSoul: this.player.maxSoul,
      discoveredCells: Array.from(this.discoveredCells || []),
      discoveredSubRegions: this.subRegionManager ? this.subRegionManager.getDiscoveredIds() : [],
      discoveredLeylineIds: Array.from(this.discoveredLeylineIds || []),
      collectedSigils: Array.from(this.collectedSigils || []),
      collectedKeys: Array.from(this.collectedKeys || []),
      openedDoors: Array.from(this.openedDoors || []),
      discoveredRooms: this.roomManager ? this.roomManager.getDiscoveredRoomIds() : [],
      clearedTrials: this.roomManager ? this.roomManager.getClearedTrialIds() : [],
      currentBiome: this.currentBiome,
      bossDefeated: this.bossDefeated || false,
      playerX: this.player.x,
      playerY: this.player.y,
    });
    if (success) {
      this.events.emit('show_toast', '💾 CHECKPOINT SAVED TO SANCTUARY');
    }
    return success;
  }

  saveGameProgress() {
    return this.saveProgress();
  }

  createParallaxBackground(worldW, worldH) {
    const w = this.scale.width;
    const h = this.scale.height;

    // Viewport-pinned panoramic background layers with vertical margin for parallax
    const bgH = h + 100;
    this.bgLayers = {
      citadel: this.add.tileSprite(0, -50, w, bgH, 'bg_citadel').setOrigin(0, 0).setScrollFactor(0).setDepth(-100),
      grotto: this.add.tileSprite(0, -50, w, bgH, 'bg_grotto').setOrigin(0, 0).setScrollFactor(0).setDepth(-100),
      foundry: this.add.tileSprite(0, -50, w, bgH, 'bg_foundry').setOrigin(0, 0).setScrollFactor(0).setDepth(-100),
      spire: this.add.tileSprite(0, -50, w, bgH, 'bg_spire').setOrigin(0, 0).setScrollFactor(0).setDepth(-100),
      sanctum: this.add.tileSprite(0, -50, w, bgH, 'bg_sanctum').setOrigin(0, 0).setScrollFactor(0).setDepth(-100),
    };

    // Initial alphas: Start with Citadel fully visible
    this.bgLayers.citadel.setAlpha(1.0);
    this.bgLayers.grotto.setAlpha(0.0);
    this.bgLayers.foundry.setAlpha(0.0);
    this.bgLayers.spire.setAlpha(0.0);
    this.bgLayers.sanctum.setAlpha(0.0);
  }

  updateParallaxBackground() {
    if (!this.bgLayers || !this.cameras.main) return;
    const cam = this.cameras.main;
    const camX = cam.scrollX;
    const camY = cam.scrollY;
    const px = this.player ? this.player.x : (camX + 480);
    const py = this.player ? this.player.y : (camY + 270);

    // Subtle horizontal parallax scrolling across 1200px panoramic textures
    const scrollRate = 0.18;
    this.bgLayers.citadel.tilePositionX = camX * scrollRate;
    this.bgLayers.grotto.tilePositionX = camX * scrollRate;
    this.bgLayers.foundry.tilePositionX = camX * scrollRate;
    this.bgLayers.spire.tilePositionX = camX * scrollRate;
    this.bgLayers.sanctum.tilePositionX = camX * scrollRate;

    // Subtle vertical parallax (shifts smoothly by at most +-35px within the 100px safety margin)
    const vertShift = ((camY % 600) / 600 - 0.5) * 40;
    for (const key in this.bgLayers) {
      this.bgLayers[key].y = -50 - vertShift;
    }

    // Determine target alpha for each biome based on player coordinates:
    // Biome 1: Whispering Catacombs (Hub): Y: 1120 to 1700, X: 0 to 4200
    // Biome 2: Crystal Grotto: Y: 0 to 1120, X: 0 to 2050
    // Biome 3: Molten Foundry: Y: 1680 to 2200, X: 1350 to 4150
    // Biome 4: Howling Spire: Y: 0 to 1120, X: 2050 to 4400
    // Biome 5: Sanctum of the Void: X: 4200 to 5400
    let targetCitadel = 0;
    let targetGrotto = 0;
    let targetFoundry = 0;
    let targetSpire = 0;
    let targetSanctum = 0;

    if (px >= 4200) {
      targetSanctum = 1.0;
    } else if (py < 1120) {
      if (px < 2050) {
        targetGrotto = 1.0;
      } else {
        targetSpire = 1.0;
      }
    } else if (py > 1680 && px >= 1350 && px < 4150) {
      targetFoundry = 1.0;
    } else {
      targetCitadel = 1.0;
    }

    // Smooth cinematic cross-fade between biomes (5% lerp per frame = ~0.35s transition)
    const lerp = 0.06;
    this.bgLayers.citadel.alpha = Phaser.Math.Linear(this.bgLayers.citadel.alpha, targetCitadel, lerp);
    this.bgLayers.grotto.alpha = Phaser.Math.Linear(this.bgLayers.grotto.alpha, targetGrotto, lerp);
    this.bgLayers.foundry.alpha = Phaser.Math.Linear(this.bgLayers.foundry.alpha, targetFoundry, lerp);
    this.bgLayers.spire.alpha = Phaser.Math.Linear(this.bgLayers.spire.alpha, targetSpire, lerp);
    this.bgLayers.sanctum.alpha = Phaser.Math.Linear(this.bgLayers.sanctum.alpha, targetSanctum, lerp);

    // Disable rendering on layers that are completely faded out to save GPU draw calls
    for (const key in this.bgLayers) {
      this.bgLayers[key].visible = this.bgLayers[key].alpha > 0.01;
    }
  }

  createAtmosphericParticles() {
    // 1. Catacombs Hub Ambient Floating Dust Motes (x: 100 to 2200, y: 1200 to 1700)
    for (let i = 0; i < 28; i++) {
      const px = Phaser.Math.Between(100, 2100);
      const py = Phaser.Math.Between(1200, 1680);
      const mote = this.add.image(px, py, 'dust_mote')
        .setScale(Phaser.Math.FloatBetween(0.6, 1.3))
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.55))
        .setDepth(5);

      this.tweens.add({
        targets: mote,
        y: py - Phaser.Math.Between(30, 80),
        x: px + Phaser.Math.Between(-40, 40),
        alpha: 0.1,
        duration: Phaser.Math.Between(3500, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 2. Crystal Grotto Luminescent Spores (x: 150 to 1850, y: 350 to 1050)
    for (let i = 0; i < 24; i++) {
      const px = Phaser.Math.Between(150, 1850);
      const py = Phaser.Math.Between(350, 1050);
      const spore = this.add.image(px, py, 'dust_mote')
        .setScale(Phaser.Math.FloatBetween(0.8, 1.6))
        .setTint(0x22d3ee)
        .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7))
        .setDepth(5);

      this.tweens.add({
        targets: spore,
        y: py + Phaser.Math.Between(-50, 50),
        x: px + Phaser.Math.Between(-60, 60),
        duration: Phaser.Math.Between(2800, 5500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 3. Molten Foundry Rising Magma Embers (x: 1450 to 4150, y: 1750 to 2150)
    for (let i = 0; i < 30; i++) {
      const px = Phaser.Math.Between(1450, 4150);
      const py = Phaser.Math.Between(1750, 2120);
      const ember = this.add.image(px, py, 'dust_mote')
        .setScale(Phaser.Math.FloatBetween(0.7, 1.4))
        .setTint(0xf97316)
        .setAlpha(Phaser.Math.FloatBetween(0.35, 0.8))
        .setDepth(5);

      this.tweens.add({
        targets: ember,
        y: py - Phaser.Math.Between(60, 140),
        x: px + Phaser.Math.Between(-25, 25),
        alpha: 0.1,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeOut',
      });
    }

    // 4. Howling Spire Wind Wisps (x: 2050 to 4350, y: 250 to 1100)
    for (let i = 0; i < 22; i++) {
      const px = Phaser.Math.Between(2050, 4350);
      const py = Phaser.Math.Between(250, 1100);
      const wisp = this.add.image(px, py, 'dust_mote')
        .setScale(Phaser.Math.FloatBetween(0.6, 1.2))
        .setTint(0x67e8f9)
        .setAlpha(Phaser.Math.FloatBetween(0.25, 0.6))
        .setDepth(5);

      this.tweens.add({
        targets: wisp,
        x: px - Phaser.Math.Between(100, 200),
        y: py + Phaser.Math.Between(-20, 20),
        duration: Phaser.Math.Between(1800, 3600),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  buildLevel(worldW, worldH) {
    // Left & Right World Boundary Walls
    this.createWall(0, 0, 32, worldH);
    this.createWall(worldW - 32, 0, 32, worldH);
    this.createPlatformRun(0, worldW, worldH - 32); // Bottom pit boundary

    const allSisters = ['wren', 'percy', 'mona', 'tilly'];
    const otherSisters = allSisters.filter((id) => id !== this.sisterId);

    // =========================================================================
    // BUILD THE 5 REGIONAL EXPANSIVE BIOMES VIA MODULAR BUILDERS
    // =========================================================================
    // 1. The Whispering Catacombs (Haven, Ossuary, Pilgrim's Way, Warden Crypt)
    CatacombsBuilder.buildAll(this);

    // 2. The Sunken Crystal Grotto (Mineral Shaft, Prismatic Chasm, Dais, Weaver Sanctum)
    GrottoBuilder.buildAll(this, otherSisters);

    // 3. The Molten Foundry (Slag Funnel, Smelting Crux, Brimstone Vault, Colossus Forge)
    FoundryBuilder.buildAll(this, otherSisters);

    // 4. The Howling Spire (Ascendant Stair, Grand Archives, Moonlit Spire, Tempest Crown)
    SpireBuilder.buildAll(this, otherSisters);

    // 5. Sanctum of the Void (Gauntlet of Trial, Void Throne Room & Malakor)
    SanctumBuilder.buildAll(this);
  }

  // --- PHASE 8: ASTRAL LEYLINES & SHORTCUT PORTCULLIS HELPERS ---
  createLeylineStone(id, x, y, name, color = '#38bdf8') {
    const stone = this.physics.add.sprite(x, y, 'leyline_stone').setDepth(4);
    stone.body.setAllowGravity(false);
    stone.body.setImmovable(true);
    stone.leylineId = id;
    stone.leylineName = name;
    stone.leylineColor = color;

    // Runic aura pulse
    const aura = this.add.circle(x, y + 10, 26, Phaser.Display.Color.HexStringToColor(color).color, 0.25).setDepth(2);
    this.tweens.add({
      targets: aura,
      scale: 1.4,
      alpha: 0.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const prompt = this.add.text(x, y - 48, '[E] ASTRAL LEYLINE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: color,
      backgroundColor: 'rgba(10, 15, 30, 0.85)',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    stone.prompt = prompt;
    this.leylines.push(stone);
    return stone;
  }

  createShortcutPortcullis(id, gateX, gateY, leverX, leverY) {
    const gate = this.platforms.create(gateX, gateY, 'shortcut_portcullis');
    gate.setOrigin(0, 0);
    gate.refreshBody();
    gate.isOpened = false;
    gate.portcullisId = id;

    // Mechanical wall lever
    const lever = this.physics.add.sprite(leverX, leverY, 'lever_switch_0').setDepth(3);
    lever.body.setAllowGravity(false);
    lever.body.setImmovable(true);
    lever.isPulled = false;
    lever.gate = gate;

    const prompt = this.add.text(leverX, leverY - 26, '[E] PULL LEVER', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#facc15',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    lever.prompt = prompt;
    this.shortcutPortcullises.push({ gate, lever });
    return gate;
  }

  teleportToLeyline(leylineId) {
    const target = ASTRAL_LEYLINES.find((l) => l.id === leylineId);
    if (!target || !this.player) return;

    soundFX.playAstralRay();
    this.createMagicBurst(this.player.x, this.player.y, 0x38bdf8);

    this.player.setPosition(target.x, target.y);
    this.player.body.setVelocity(0, 0);

    this.createMagicBurst(target.x, target.y, 0x38bdf8);
    soundFX.playCollect();
    this.events.emit('show_toast', `✨ WARPED TO ${target.name.toUpperCase()}`);
  }

  openLeylineFastTravelMenu() {
    soundFX.playCollect();
    this.events.emit('open_leyline_fast_travel', {
      discoveredIds: Array.from(this.discoveredLeylineIds),
      allLeylines: ASTRAL_LEYLINES,
    });
  }

  // --- PLATFORM & HAZARD CREATION HELPERS ---
  createPlatform(x, y, width, tileKey = 'tile_platform') {
    const tileCount = Math.ceil(width / 32);
    for (let i = 0; i < tileCount; i++) {
      const p = this.platforms.create(x + i * 32, y, tileKey);
      p.setOrigin(0, 0);
      p.refreshBody();
    }
  }

  createPlatformRun(startX, endX, y, tileKey = 'tile_stone') {
    for (let x = startX; x < endX; x += 32) {
      const p = this.platforms.create(x, y, tileKey);
      p.setOrigin(0, 0);
      p.refreshBody();
    }
  }

  createWall(x, y, width, height, tileKey = 'tile_stone') {
    for (let curX = x; curX < x + width; curX += 32) {
      for (let curY = y; curY < y + height; curY += 32) {
        const w = this.platforms.create(curX, curY, tileKey);
        w.setOrigin(0, 0);
        w.refreshBody();
      }
    }
  }

  createSpikeRun(startX, endX, y) {
    for (let x = startX; x < endX; x += 32) {
      const s = this.hazards.create(x, y - 6, 'spikes');
      s.setOrigin(0, 0);
      s.refreshBody();
    }
  }

  createLavaRun(startX, endX, y) {
    for (let x = startX; x < endX; x += 32) {
      const lava = this.hazards.create(x, y - 4, 'hazard_lava');
      lava.setOrigin(0, 0);
      lava.refreshBody();
    }
  }

  createTorch(x, y) {
    const torch = this.add.sprite(x, y, 'torch_0').setDepth(4);
    const flare = this.add.circle(x + 8, y + 6, 12, 0xf97316, 0.4).setDepth(4);
    const glow = this.add.image(x + 8, y + 6, 'light_glow_warm')
      .setScale(1.15)
      .setAlpha(0.55)
      .setDepth(2);

    this.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.72,
      duration: 500 + Phaser.Math.Between(0, 300),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const f = Phaser.Math.Between(0, 2);
        torch.setTexture(`torch_${f}`);
        flare.setAlpha(Phaser.Math.FloatBetween(0.5, 0.85));
      },
    });
  }

  // --- METROIDVANIA MECHANICS: WALLS, RINGS, PEDESTALS ---
  createCrackedWall(x, y) {
    const wall = this.crackedWalls.create(x, y, 'cracked_wall');
    wall.setOrigin(0, 0);
    wall.refreshBody();
    return wall;
  }

  destroyCrackedWall(wall) {
    soundFX.playWallBreak();
    this.cameras.main.shake(160, 0.012);

    for (let i = 0; i < 14; i++) {
      const p = this.add.rectangle(
        wall.x + Phaser.Math.Between(4, 28),
        wall.y + Phaser.Math.Between(10, 86),
        Phaser.Math.Between(4, 10),
        Phaser.Math.Between(4, 10),
        0x475569
      );
      this.physics.add.existing(p);
      p.body.setVelocity(Phaser.Math.Between(-180, 180), Phaser.Math.Between(-250, -50));
      this.tweens.add({
        targets: p,
        alpha: 0,
        rotation: Phaser.Math.Between(-3, 3),
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    this.createDamageNumber(wall.x + 16, wall.y + 40, 'SHATTERED!', '#f59e0b');
    wall.destroy();
  }

  createGrappleRing(x, y) {
    const ring = this.add.image(x, y, 'grapple_ring');
    this.grappleRings.add(ring);

    this.tweens.add({
      targets: ring,
      scale: 1.15,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return ring;
  }

  findNearestGrappleRing(x, y, maxDist = 280) {
    let nearest = null;
    let minDist = maxDist;

    this.grappleRings.getChildren().forEach((ring) => {
      if (ring.y <= y + 20) {
        const d = Phaser.Math.Distance.Between(x, y, ring.x, ring.y);
        if (d < minDist) {
          minDist = d;
          nearest = ring;
        }
      }
    });

    return nearest;
  }

  createArcanePedestal(x, y, bridgeConfig) {
    const ped = this.arcanePedestals.create(x, y, 'arcane_crystal_dormant');
    ped.setOrigin(0, 0);
    ped.refreshBody();
    ped.activated = false;
    ped.bridgeConfig = bridgeConfig;
    return ped;
  }

  activateArcanePedestal(ped) {
    ped.activated = true;
    ped.setTexture('arcane_crystal_active');
    soundFX.playCrystalActivate();
    this.cameras.main.shake(120, 0.007);
    this.createMagicBurst(ped.x + 14, ped.y + 14, 0x22d3ee);
    this.createDamageNumber(ped.x + 14, ped.y - 20, 'CRYSTAL ENERGIZED!', '#22d3ee');

    if (ped.bridgeConfig) {
      const { startX, endX, y } = ped.bridgeConfig;
      for (let bx = startX; bx < endX; bx += 32) {
        const br = this.platforms.create(bx, y, 'spectral_bridge');
        br.setOrigin(0, 0);
        br.refreshBody();
        br.setAlpha(0);
        this.tweens.add({
          targets: br,
          alpha: 1,
          duration: 400,
        });
      }
      this.createMagicBurst((startX + endX) / 2, y, 0x06b6d4);
    }
  }

  createImprisonedSister(sisterId, x, y, chamberNum) {
    const sisterData = SISTERS_DATA[sisterId];
    const sisterSprite = this.add.sprite(x, y, `${sisterId}_idle_0`);
    sisterSprite.setTint(sisterData.palette.projectileTint);

    const bubble = this.add.image(x, y, 'stasis_bubble');
    this.tweens.add({
      targets: [sisterSprite, bubble],
      y: y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const prompt = this.add.text(x, y - 48, `[E] RESCUE ${sisterData.name.toUpperCase()}`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: sisterData.themeColor,
      stroke: '#000000',
      strokeThickness: 3,
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    prompt.setAlpha(0);

    const chamber = {
      sisterId,
      sisterData,
      abilityInfo: SISTER_ABILITY_MAP[sisterId],
      x,
      y,
      chamberNum,
      sprite: sisterSprite,
      bubble,
      prompt,
      rescued: false,
    };

    this.imprisonedSisters.push(chamber);
  }

  rescueSister(sister) {
    sister.rescued = true;
    sister.prompt.destroy();
    soundFX.playSisterRescue();
    this.cameras.main.shake(200, 0.012);

    // Pop stasis bubble
    this.tweens.add({
      targets: sister.bubble,
      scale: 1.8,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        sister.bubble.destroy();
      },
    });

    // Fade out stasis sprite in chamber and move to campfire haven hub
    this.tweens.add({
      targets: sister.sprite,
      alpha: 0,
      scale: 1.3,
      duration: 500,
      onComplete: () => {
        sister.sprite.destroy();
      },
    });

    // Add to rescued sisters set and spawn/update at Campfire Haven
    this.rescuedSisterIds.add(sister.sisterId);
    this.updateCampfireSisters();

    // Bestow ability onto player
    const abilityKey = sister.abilityInfo.key;
    this.player.unlockAbility(abilityKey);

    // Particle burst
    this.createMagicBurst(sister.x, sister.y, sister.sisterData.palette.accent);
    this.createDamageNumber(sister.x, sister.y - 40, `${sister.abilityInfo.name.toUpperCase()} UNLOCKED!`, sister.sisterData.themeColor);

    // Open dialogue modal in UIScene
    this.events.emit('sister_rescued', {
      rescuedSister: sister.sisterData,
      rescuerSister: this.player.sisterData,
      abilityInfo: sister.abilityInfo,
    });

    this.saveProgress();
  }

  // --- PHASE 4: CAMPFIRE HAVEN & GATHERED SISTERS ---
  setupCampfireHaven() {
    // Warm ambient haven glow at central campfire (x: 800, y: 1626)
    this.campfireGlow = this.add.image(800, 1626, 'campfire_haven_glow').setDepth(3).setAlpha(0.65);
    this.tweens.add({
      targets: this.campfireGlow,
      alpha: 0.38,
      scale: 1.18,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Make shrine directly clickable with mouse
    if (this.shrine) {
      this.shrine.setInteractive({ useHandCursor: true });
      this.shrine.on('pointerdown', () => this.openCampfireHavenMenu());
    }

    // Campfire interaction prompt
    this.campfirePrompt = this.add.text(800, 1565, '[E] REST AT CAMPFIRE', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f59e0b',
      stroke: '#000000',
      strokeThickness: 3,
      letterSpacing: 1.5,
    }).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.campfirePrompt.setInteractive({ useHandCursor: true });
    this.campfirePrompt.on('pointerdown', () => this.openCampfireHavenMenu());

    // Initial campfire sister setup
    this.updateCampfireSisters();
  }

  updateCampfireSisters() {
    const slotPositions = {
      wren: { x: 650, y: 1622, facing: 'right' },
      percy: { x: 725, y: 1622, facing: 'right' },
      mona: { x: 875, y: 1622, facing: 'left' },
      tilly: { x: 935, y: 1622, facing: 'left' },
    };

    ['wren', 'percy', 'mona', 'tilly'].forEach((id) => {
      // If this sister is currently being controlled as the player, she shouldn't be sitting at the campfire
      if (this.player && this.player.sisterId === id) {
        if (this.gatheredSisterSprites[id]) {
          this.gatheredSisterSprites[id].sprite.setVisible(false);
          this.gatheredSisterSprites[id].prompt.setVisible(false);
        }
        return;
      }

      // If she is in rescuedSisterIds, show her resting at campfire
      if (this.rescuedSisterIds.has(id)) {
        const slot = slotPositions[id];
        const sisterData = SISTERS_DATA[id];

        if (!this.gatheredSisterSprites[id]) {
          const sprite = this.add.sprite(slot.x, slot.y, `${id}_idle_0`).setDepth(10);
          sprite.setFlipX(slot.facing === 'left');
          sprite.setInteractive({ useHandCursor: true });
          sprite.on('pointerdown', () => this.talkToSister(id));

          // Subtle idle breathing
          this.tweens.add({
            targets: sprite,
            y: slot.y - 3,
            duration: 1000 + (id.length * 150),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });

          // Floating talk prompt
          const prompt = this.add.text(slot.x, slot.y - 46, `[E] TALK TO ${sisterData.name.toUpperCase()}`, {
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: sisterData.themeColor,
            stroke: '#000000',
            strokeThickness: 3,
            letterSpacing: 1.2,
          }).setOrigin(0.5).setAlpha(0).setDepth(20);
          prompt.setInteractive({ useHandCursor: true });
          prompt.on('pointerdown', () => this.talkToSister(id));

          this.gatheredSisterSprites[id] = {
            id,
            data: sisterData,
            sprite,
            prompt,
            x: slot.x,
            y: slot.y,
          };
        } else {
          const entry = this.gatheredSisterSprites[id];
          entry.x = slot.x;
          entry.y = slot.y;
          entry.sprite.setPosition(slot.x, slot.y);
          entry.sprite.setFlipX(slot.facing === 'left');
          entry.sprite.setVisible(true);
          entry.prompt.setPosition(slot.x, slot.y - 46);
          entry.prompt.setVisible(true);
        }
      } else {
        if (this.gatheredSisterSprites[id]) {
          this.gatheredSisterSprites[id].sprite.setVisible(false);
          this.gatheredSisterSprites[id].prompt.setVisible(false);
        }
      }
    });
  }

  openCampfireHavenMenu() {
    this.events.emit('open_campfire_haven', {
      currentLead: this.player.sisterId,
      rescuedSisters: Array.from(this.rescuedSisterIds),
      collectedKeepsakes: Array.from(this.player.collectedKeepsakes),
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      soul: this.player.soul,
      maxSoul: this.player.maxSoul,
    });
  }

  talkToSister(sisterId) {
    soundFX.playCampfireBanter();
    const sisterData = SISTERS_DATA[sisterId];
    const keepsakeMap = {
      wren: 'keepsake_ribbon',
      percy: 'keepsake_crest',
      mona: 'keepsake_stardial',
      tilly: 'keepsake_charm',
    };
    const hasKeepsake = this.player.collectedKeepsakes.has(keepsakeMap[sisterId]);

    this.events.emit('open_sister_banter', {
      sisterId,
      sisterData,
      currentLead: this.player.sisterData,
      hasKeepsake,
    });
  }

  // --- PHASE 4: ANCIENT SISTER KEEPSAKES PLACEMENT ---
  spawnKeepsakes() {
    const keepsakeConfigs = [
      {
        id: 'keepsake_ribbon',
        name: "Wren's Zephyr Ribbon",
        type: 'health',
        bonus: 25,
        x: 650,
        y: 1370,
        texture: 'keepsake_ribbon',
        color: '#10b981',
        desc: '+25 Max Health',
        platX: 600,
        platY: 1400,
        platW: 100,
        platTex: 'tile_platform',
      },
      {
        id: 'keepsake_crest',
        name: "Percy's Aegis Crest",
        type: 'health',
        bonus: 25,
        x: 2750,
        y: 1890,
        texture: 'keepsake_crest',
        color: '#f59e0b',
        desc: '+25 Max Health',
        platX: 2700,
        platY: 1920,
        platW: 100,
        platTex: 'tile_foundry_plat',
      },
      {
        id: 'keepsake_stardial',
        name: "Mona's Astral Stardial",
        type: 'soul',
        bonus: 25,
        x: 680,
        y: 640,
        texture: 'keepsake_stardial',
        color: '#c084fc',
        desc: '+25 Max Soul',
        platX: 630,
        platY: 670,
        platW: 100,
        platTex: 'tile_crystal_plat',
      },
      {
        id: 'keepsake_charm',
        name: "Tilly's Scout Charm",
        type: 'soul',
        bonus: 25,
        x: 3450,
        y: 270,
        texture: 'keepsake_charm',
        color: '#ef4444',
        desc: '+25 Max Soul',
        platX: 3400,
        platY: 300,
        platW: 100,
        platTex: 'tile_spire_plat',
      },
    ];

    keepsakeConfigs.forEach((cfg) => {
      // Secret alcove platform
      this.createPlatform(cfg.platX, cfg.platY, cfg.platW, cfg.platTex);

      const item = this.keepsakes.create(cfg.x, cfg.y, cfg.texture);
      item.body.setAllowGravity(false);
      item.body.setImmovable(true);
      item.keepsakeConfig = cfg;

      // Gentle floating sine tween
      this.tweens.add({
        targets: item,
        y: cfg.y - 8,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Ambient rotating light ring
      const halo = this.add.circle(cfg.x, cfg.y, 16, Phaser.Display.Color.HexStringToColor(cfg.color).color, 0.22);
      this.tweens.add({
        targets: halo,
        scale: 1.4,
        alpha: 0.08,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
      item.halo = halo;
    });

    // Overlap with player
    this.physics.add.overlap(this.player, this.keepsakes, (p, item) => {
      if (!item || !item.active) return;
      const cfg = item.keepsakeConfig;
      const collected = this.player.applyKeepsake(cfg.id, cfg.type, cfg.bonus);
      if (collected) {
        if (item.halo) item.halo.destroy();
        const ix = item.x;
        const iy = item.y;
        item.destroy();

        this.createMagicBurst(ix, iy, Phaser.Display.Color.HexStringToColor(cfg.color).color);
        this.createDamageNumber(ix, iy - 20, `${cfg.desc.toUpperCase()}!`, cfg.color);
        this.events.emit('show_toast', `⭐ ANCIENT KEEPSAKE ACQUIRED: ${cfg.name.toUpperCase()} (${cfg.desc})`);
        this.saveProgress();
      }
    });
  }

  // =========================================================================
  // PHASE 6.5: GREAT VOID BASTION GATE & THE 4 PRIMORDIAL SIGILS
  // =========================================================================
  createSanctumBarrier(x, y) {
    this.createGreatBastionGate(x, y);
  }

  createGreatBastionGate(x, y) {
    this.bastionGate = this.physics.add.staticSprite(x, y, 'bastion_gate');
    this.bastionGate.setOrigin(0, 0);
    this.bastionGate.refreshBody();
    this.bastionGateOpened = false;

    // Sockets for the 4 Primordial Sigils (Crypt y:24, Prism y:58, Forge y:92, Gale y:126)
    this.bastionSockets = {
      sigil_crypt: this.add.image(x + 24, y + 24, 'bastion_socket_crypt').setDepth(3).setVisible(this.collectedSigils.has('sigil_crypt')),
      sigil_prism: this.add.image(x + 24, y + 58, 'bastion_socket_prism').setDepth(3).setVisible(this.collectedSigils.has('sigil_prism')),
      sigil_forge: this.add.image(x + 24, y + 92, 'bastion_socket_forge').setDepth(3).setVisible(this.collectedSigils.has('sigil_forge')),
      sigil_gale: this.add.image(x + 24, y + 126, 'bastion_socket_gale').setDepth(3).setVisible(this.collectedSigils.has('sigil_gale')),
    };

    // If all 4 were already collected in saved data, show all lit
    this.updateBastionSockets();
  }

  updateBastionSockets() {
    if (!this.bastionSockets) return;
    for (const id in this.bastionSockets) {
      if (this.collectedSigils.has(id)) {
        this.bastionSockets[id].setVisible(true);
      }
    }
  }

  checkBastionGate() {
    if (this.bastionGateOpened) return;

    this.updateBastionSockets();

    if (this.collectedSigils.size >= 4) {
      this.openGreatBastionGate();
    } else {
      const sigilNames = ['Crypt', 'Prism', 'Forge', 'Gale'];
      const sigilKeys = ['sigil_crypt', 'sigil_prism', 'sigil_forge', 'sigil_gale'];
      const status = sigilKeys.map((k, i) => `${sigilNames[i]}: ${this.collectedSigils.has(k) ? '✓' : '✗'}`).join(' | ');
      this.events.emit('show_toast', `🔒 THE GREAT VOID BASTION: Requires 4 Primordial Sigils! [${status}]`);
      this.createMagicBurst(this.bastionGate.x + 24, this.bastionGate.y + 80, 0xdb2777);
    }
  }

  openGreatBastionGate() {
    this.bastionGateOpened = true;
    soundFX.playBarrierShatter();
    this.cameras.main.shake(500, 0.025);

    // Beams of radiant light bursting from all 4 sockets
    const colors = [0x38bdf8, 0xc084fc, 0xf97316, 0x10b981];
    colors.forEach((col, i) => {
      this.time.delayedCall(i * 120, () => {
        this.createMagicBurst(this.bastionGate.x + 24, this.bastionGate.y + 24 + i * 34, col);
      });
    });

    this.createDamageNumber(this.bastionGate.x + 24, this.bastionGate.y - 20, 'GREAT BASTION BREACHED!', '#fbbf24');
    this.events.emit('show_toast', '🌟 THE 4 PRIMORDIAL SIGILS UNSEAL THE VOID BASTION! MALAKOR AWAITS!');

    this.tweens.add({
      targets: this.bastionGate,
      y: this.bastionGate.y - 160,
      alpha: 0.1,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        if (this.bastionGate && this.bastionGate.body) this.bastionGate.body.enable = false;
        if (this.bastionSockets) {
          Object.values(this.bastionSockets).forEach((s) => s.destroy());
        }
      },
    });
  }

  openSanctumBarrier() {
    this.openGreatBastionGate();
  }

  // =========================================================================
  // PHASE 6.5: PRIMORDIAL SIGIL & RELIC KEY PICKUPS
  // =========================================================================
  spawnPrimordialSigil(sigilId, x, y) {
    if (this.collectedSigils.has(sigilId)) return;

    const sigilData = PRIMORDIAL_SIGILS[sigilId];
    if (!sigilData) return;

    const sigil = this.sigilPickups.create(x, y, sigilData.texture);
    sigil.sigilId = sigilId;
    sigil.sigilData = sigilData;
    sigil.body.setAllowGravity(false);
    sigil.setDepth(5);

    this.tweens.add({
      targets: sigil,
      y: y - 10,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const glow = this.add.image(x, y, 'light_glow_cool')
      .setScale(1.2)
      .setAlpha(0.7)
      .setTint(sigilData.colorHex)
      .setDepth(4);

    this.tweens.add({
      targets: glow,
      scale: 1.6,
      alpha: 0.9,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    sigil.glow = glow;
  }

  collectPrimordialSigil(sigil) {
    if (!sigil || !sigil.active) return;
    const { sigilId, sigilData } = sigil;
    if (sigil.glow) sigil.glow.destroy();
    sigil.destroy();

    this.collectedSigils.add(sigilId);
    soundFX.playSigilCollect();
    this.cameras.main.shake(350, 0.015);
    this.createMagicBurst(this.player.x, this.player.y - 20, sigilData.colorHex);

    this.updateBastionSockets();

    this.events.emit('sigil_collected', {
      sigilId,
      sigilData,
      totalCount: this.collectedSigils.size,
    });

    this.events.emit('show_toast', `✨ ACQUIRED: ${sigilData.name.toUpperCase()}! (${this.collectedSigils.size}/4 SIGILS)`);
    this.saveGameProgress();
  }

  spawnRelicKey(keyId, x, y) {
    if (this.collectedKeys.has(keyId)) return;

    const keyData = RELIC_KEYS[keyId];
    if (!keyData) return;

    const keySprite = this.keyPickups.create(x, y, keyData.texture);
    keySprite.keyId = keyId;
    keySprite.keyData = keyData;
    keySprite.body.setAllowGravity(false);
    keySprite.setDepth(5);

    this.tweens.add({
      targets: keySprite,
      y: y - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collectRelicKey(keySprite) {
    if (!keySprite || !keySprite.active) return;
    const { keyId, keyData } = keySprite;
    keySprite.destroy();

    this.collectedKeys.add(keyId);
    soundFX.playKeyCollect();
    this.cameras.main.shake(200, 0.01);
    this.createMagicBurst(this.player.x, this.player.y - 20, 0xfbbf24);

    this.events.emit('key_collected', {
      keyId,
      keyData,
      totalCount: this.collectedKeys.size,
    });

    this.events.emit('show_toast', `🔑 ACQUIRED: ${keyData.name.toUpperCase()}!`);
    this.saveGameProgress();
  }

  createRelicDoor(doorId, requiredKeyId, x, y, doorName = 'Locked Portcullis') {
    const door = this.relicDoors.create(x, y, 'relic_portcullis');
    door.doorId = doorId;
    door.requiredKeyId = requiredKeyId;
    door.doorName = doorName;
    door.setOrigin(0, 0);
    door.refreshBody();

    const prompt = this.add.text(x + 16, y - 24, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#facc15',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
    door.prompt = prompt;

    if (this.openedDoors.has(doorId)) {
      door.y -= 96;
      door.alpha = 0.2;
      if (door.body) door.body.enable = false;
      prompt.destroy();
    }
    return door;
  }

  interactWithRelicDoor(door) {
    if (!door || !door.active || this.openedDoors.has(door.doorId)) return;

    const keyData = RELIC_KEYS[door.requiredKeyId];
    const hasKey = this.collectedKeys.has(door.requiredKeyId);
    const hasMonaPower = door.doorId === 'door_grotto_vault' && (this.player.abilities.astralRay || this.rescuedSisterIds.has('mona'));

    if (hasKey || hasMonaPower) {
      this.openedDoors.add(door.doorId);
      soundFX.playDoorUnlock();
      this.cameras.main.shake(250, 0.012);
      this.createDamageNumber(door.x + 16, door.y - 16, 'UNLOCKED!', '#10b981');
      const unlockReason = hasKey ? (keyData ? keyData.name.toUpperCase() : 'KEY') : "MONA'S ASTRAL RAY";
      this.events.emit('show_toast', `🔓 ${door.doorName.toUpperCase()} UNLOCKED WITH ${unlockReason}!`);
      if (door.prompt) door.prompt.destroy();

      this.tweens.add({
        targets: door,
        y: door.y - 96,
        alpha: 0.2,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          if (door.body) door.body.enable = false;
        },
      });
      this.saveGameProgress();
    } else {
      const now = this.time.now;
      if (!door.lastPromptTime || now - door.lastPromptTime > 1500) {
        door.lastPromptTime = now;
        soundFX.playWallBreak();
        this.createMagicBurst(door.x + 16, door.y + 48, 0xf59e0b);
        this.events.emit('show_toast', `🔒 LOCKED: Requires ${keyData ? keyData.name : 'Relic Key'}!`);
      }
    }
  }

  // =========================================================================
  // PHASE 6.5: CROSS-BIOME ABILITY MECHANICS & HAZARDS
  // =========================================================================
  createThermalConduit(x, y, targetBlastGate) {
    const conduit = this.thermalConduits.create(x, y, 'thermal_conduit_off');
    conduit.targetBlastGate = targetBlastGate;
    conduit.activated = false;
    conduit.setOrigin(0.5, 0.5);
    conduit.refreshBody();
    return conduit;
  }

  activateThermalConduit(conduit) {
    if (!conduit || conduit.activated) return;
    conduit.activated = true;
    conduit.setTexture('thermal_conduit_on');
    soundFX.playCrystalActivate();
    this.cameras.main.shake(250, 0.015);
    this.createMagicBurst(conduit.x, conduit.y, 0xf97316);
    this.events.emit('show_toast', '🔥 THERMAL CONDUIT IGNITED! BLAST GATE DEPRESSURIZED!');

    if (conduit.targetBlastGate) {
      this.tweens.add({
        targets: conduit.targetBlastGate,
        y: conduit.targetBlastGate.y - 96,
        alpha: 0.2,
        duration: 900,
        onComplete: () => {
          if (conduit.targetBlastGate.body) conduit.targetBlastGate.body.enable = false;
        },
      });
    }
  }

  createIronCounterweight(x, y, targetElevator) {
    const weight = this.ironCounterweights.create(x, y, 'iron_counterweight');
    weight.targetElevator = targetElevator;
    weight.shattered = false;
    weight.setOrigin(0.5, 0.5);
    weight.refreshBody();
    return weight;
  }

  shatterIronCounterweight(weight) {
    if (!weight || weight.shattered) return;
    weight.shattered = true;
    soundFX.playWallBreak();
    this.cameras.main.shake(300, 0.02);
    this.createMagicBurst(weight.x, weight.y, 0x94a3b8);
    this.events.emit('show_toast', '⛓️ COUNTERWEIGHT SMASHED! ELEVATOR ENGAGED!');

    if (weight.targetElevator) {
      this.tweens.add({
        targets: weight.targetElevator,
        y: weight.targetElevator.y - 160,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.tweens.add({
      targets: weight,
      scale: 0.1,
      alpha: 0,
      duration: 400,
      onComplete: () => weight.destroy(),
    });
  }

  createCrumblingPlatform(x, y, width = 64) {
    const plat = this.platforms.create(x, y, 'tile_crumbling');
    plat.setDisplaySize(width, 20);
    plat.refreshBody();
    plat.origX = x;
    plat.origY = y;
    plat.isCrumbling = false;
    this.crumblingPlatforms.push(plat);
    return plat;
  }

  updateCrumblingPlatforms() {
    this.crumblingPlatforms.forEach((plat) => {
      if (!plat || !plat.active || plat.isCrumbling) return;
      if (this.player.body.touching.down && (plat.body.touching.up || (Math.abs(this.player.y - (plat.y - 32)) < 12 && this.player.x >= plat.x - plat.displayWidth / 2 && this.player.x <= plat.x + plat.displayWidth / 2))) {
        plat.isCrumbling = true;
        this.tweens.add({
          targets: plat,
          x: plat.origX + 3,
          duration: 50,
          yoyo: true,
          repeat: 8,
          onComplete: () => {
            soundFX.playWallBreak();
            this.tweens.add({
              targets: plat,
              y: plat.origY + 40,
              alpha: 0,
              duration: 350,
              onComplete: () => {
                if (plat.body) plat.body.enable = false;
                this.time.delayedCall(3000, () => {
                  plat.x = plat.origX;
                  plat.y = plat.origY;
                  plat.alpha = 1;
                  plat.isCrumbling = false;
                  if (plat.body) plat.body.enable = true;
                  plat.refreshBody();
                });
              },
            });
          },
        });
      }
    });
  }

  handlePitFall() {
    if (!this.player || this.player.isDead) return;
    this.player.takeDamage(15, this.player.x);
    const cp = this.player.checkpoint || { x: 800, y: 1600 };
    this.player.setPosition(cp.x, cp.y);
    if (this.player.body) {
      this.player.body.setVelocity(0, 0);
    }
    this.cameras.main.pan(cp.x, cp.y, 200, 'Linear', true);
    this.events.emit('show_toast', '⚠️ Plunged into the abyss! Returned to safety.');
  }

  // Enemy Class Accessors for RoomManager Trial Spawners
  getSkeletonClass() { return SkeletonKnight; }
  getGargoyleClass() { return ShadowGargoyle; }
  getMagmaSentinelClass() { return MagmaSentinel; }
  getWispClass() { return ArcaneWisp; }
  getHarpyClass() { return StormHarpy; }

  // --- PROJECTILES & COMBAT ATTACKS ---
  spawnAstralRay(x, y, dir) {
    const beam = this.add.container(x, y);

    for (let i = 0; i < 6; i++) {
      const seg = this.add.image(dir * (i * 44 + 22), 0, 'astral_ray_beam');
      seg.setFlipX(dir === -1);
      beam.add(seg);
    }

    // Spawn piercing projectile pulses in this.astralRays physics group
    for (let i = 0; i < 4; i++) {
      const px = x + dir * (i * 60 + 20);
      const pulse = this.astralRays.create(px, y, 'astral_ray_beam');
      pulse.setVisible(false);
      pulse.body.setAllowGravity(false);
      pulse.body.setVelocityX(dir * 550);

      this.time.delayedCall(260, () => {
        if (pulse && pulse.active) pulse.destroy();
      });
    }

    this.tweens.add({
      targets: beam,
      alpha: 0,
      scaleY: 0.2,
      duration: 220,
      onComplete: () => {
        beam.destroy();
      },
    });
  }

  handleShieldBashImpact(shieldHitbox, dir) {
    this.physics.overlap(shieldHitbox, this.crackedWalls, (hb, wall) => {
      if (wall && wall.active) {
        this.destroyCrackedWall(wall);
      }
    });

    // Phase 6.5: Smash suspended iron counterweights
    this.physics.overlap(shieldHitbox, this.ironCounterweights, (hb, weight) => {
      if (weight && weight.active) {
        this.shatterIronCounterweight(weight);
      }
    });

    this.physics.overlap(shieldHitbox, this.enemies, (hb, enemy) => {
      if (enemy && typeof enemy.takeDamage === 'function' && !enemy.isDead) {
        soundFX.playShieldBash();
        soundFX.playHit(true);
        enemy.takeDamage(45, this.player.x, 'shield_bash');
        if (enemy.body) {
          enemy.body.setVelocityX(dir * 320);
          enemy.body.setVelocityY(-160);
        }
        this.createMagicBurst(enemy.x, enemy.y, 0xf59e0b);
      }
    });
  }

  spawnSoulBolt(x, y, dir, tint) {
    const bolt = this.playerBolts.create(x, y, 'soul_bolt');
    bolt.body.setAllowGravity(false);
    if (tint) bolt.setTint(tint);
    bolt.body.setVelocityX(dir * 460);

    this.time.delayedCall(1400, () => {
      if (bolt.active) bolt.destroy();
    });
  }

  spawnSlashWave(x, y, dir, tint) {
    const wave = this.slashWaves.create(x, y, 'slash_wave');
    wave.body.setAllowGravity(false);
    wave.setFlipX(dir === -1);
    if (tint) wave.setTint(tint);
    wave.body.setVelocityX(dir * 420);

    this.time.delayedCall(450, () => {
      if (wave && wave.active) {
        this.createMagicBurst(wave.x, wave.y, 0x2ce8f5);
        wave.destroy();
      }
    });
  }

  spawnEmber(fromX, fromY, toX, toY) {
    const ember = this.enemyEmbers.create(fromX, fromY, 'ember_proj');
    ember.body.setAllowGravity(false);
    this.physics.moveTo(ember, toX, toY, 200);

    this.time.delayedCall(2200, () => {
      if (ember.active) ember.destroy();
    });
  }

  spawnWispSpark(fromX, fromY, toX, toY) {
    const spark = this.enemyEmbers.create(fromX, fromY, 'wisp_spark');
    spark.body.setAllowGravity(false);
    this.physics.moveTo(spark, toX, toY, 210);

    this.time.delayedCall(2400, () => {
      if (spark.active) spark.destroy();
    });
  }

  spawnMagmaBall(fromX, fromY, toX, toY) {
    const ball = this.enemyEmbers.create(fromX, fromY, 'magma_ball');
    ball.body.setAllowGravity(false);
    this.physics.moveTo(ball, toX, toY, 220);

    this.time.delayedCall(2200, () => {
      if (ball.active) ball.destroy();
    });
  }

  spawnShockwave(x, y, dir) {
    const wave = this.bossShockwaves.create(x, y, 'boss_shockwave');
    wave.body.setAllowGravity(false);
    wave.body.setVelocityX(dir * 240);

    this.time.delayedCall(1600, () => {
      if (wave.active) wave.destroy();
    });
  }

  spawnSoulOrbs(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      const orb = this.soulOrbs.create(x, y, 'soul_orb');
      orb.body.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-240, -100));
      orb.setBounce(0.5);
      orb.setCollideWorldBounds(true);
      this.physics.add.collider(orb, this.platforms);
    }
  }

  openChest() {
    this.chestOpened = true;
    this.chest.setTint(0xfacc15);
    soundFX.playCollect();

    this.spawnSoulOrbs(this.chest.x, this.chest.y - 15, 6);
    this.events.emit('shrine_rested');
    this.createMagicBurst(this.chest.x, this.chest.y, 0xfacc15);
    this.createDamageNumber(this.chest.x, this.chest.y - 30, 'SOUL SURGE!', '#facc15');
  }

  triggerBossEncounter() {
    this.bossTriggered = true;

    // Slam shut the portcullis at x: 4480 to seal player and boss inside the Sanctum
    for (let y = 1530; y < 1650; y += 32) {
      const g = this.bossGate.create(4480, y, 'tile_stone');
      g.setTint(0x7e22ce);
      g.setOrigin(0, 0);
      g.refreshBody();
    }
    this.physics.add.collider(this.player, this.bossGate);
    this.physics.add.collider(this.boss, this.bossGate);

    // Activate Boss
    this.boss.activateBoss();
  }

  // --- COLLISION SETUP ---
  setupCollisions() {
    // Player vs Platforms & Obstacles
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crackedWalls);
    this.physics.add.collider(this.player, this.arcanePedestals);

    // Player vs Great Void Bastion Gate (Requires 4 Primordial Sigils)
    if (this.bastionGate) {
      this.physics.add.collider(this.player, this.bastionGate, () => {
        this.checkBastionGate();
      });
    }

    // Phase 6.5: Pickups, Relic Doors, Thermal Conduits & Counterweights
    this.physics.add.overlap(this.player, this.sigilPickups, (p, sigil) => {
      this.collectPrimordialSigil(sigil);
    });

    this.physics.add.overlap(this.player, this.keyPickups, (p, key) => {
      this.collectRelicKey(key);
    });

    this.physics.add.collider(this.player, this.relicDoors, (p, door) => {
      this.interactWithRelicDoor(door);
    });

    this.physics.add.collider(this.player, this.ironCounterweights, (p, weight) => {
      if (p.isBashing || p.isAirDashing || this.keys.shieldBash?.isDown || this.keys.shieldBashAlt?.isDown) {
        this.shatterIronCounterweight(weight);
      }
    });

    this.physics.add.overlap(this.astralRays, this.thermalConduits, (ray, conduit) => {
      this.activateThermalConduit(conduit);
    });

    // Enemies vs Platforms & Cracked Walls
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crackedWalls);

    // Player vs Hazards (spikes & bubbling lava)
    this.physics.add.overlap(this.player, this.hazards, (player) => {
      player.takeDamage(24, player.x);
    });

    // Player Sword Hitbox vs Enemies
    this.physics.add.overlap(this.player.swordHitbox, this.enemies, (a, b) => {
      const enemy = (a && typeof a.takeDamage === 'function') ? a : ((b && typeof b.takeDamage === 'function') ? b : null);
      const now = this.time.now;
      if (enemy && this.player.isAttacking && !enemy.isDead) {
        if (!enemy.lastHitTime || now - enemy.lastHitTime > 100) {
          enemy.lastHitTime = now;
          let damage = [0, 25, 30, 50][this.player.comboStep] || 25;

          if (this.player.isUppercutting) {
            damage = 48;
            if (enemy.juggleFloat) enemy.juggleFloat(380);
          } else if (this.player.isDiving) {
            damage = 70;
            if (enemy.stagger) enemy.stagger(1200);
          }

          if (this.player.isCounterCharged) {
            damage *= 2;
            this.player.isCounterCharged = false;
            this.createDamageNumber(enemy.x, enemy.y - 30, 'CRITICAL COUNTER!', '#fbbf24');
          }

          enemy.takeDamage(damage, this.player.x, 'melee');
          this.player.gainSoul(12);

          // Screen freeze hitstop for 40ms
          this.physics.world.pause();
          setTimeout(() => this.physics.world.resume(), 40);
        }
      }
    });

    // 3rd Combo Strike Long-Range Crescent Wave vs Enemies
    this.physics.add.overlap(this.slashWaves, this.enemies, (a, b) => {
      const enemy = (a && typeof a.takeDamage === 'function') ? a : ((b && typeof b.takeDamage === 'function') ? b : null);
      const wave = enemy === a ? b : a;

      if (!enemy || !wave || !wave.active || enemy.isDead) return;

      const waveX = wave.x;
      wave.destroy();
      this.createMagicBurst(waveX, enemy.y, 0x2ce8f5);
      enemy.takeDamage(42, waveX);
      this.player.gainSoul(8);
    });

    // Player Soul Bolt Projectiles vs Enemies
    this.physics.add.overlap(this.playerBolts, this.enemies, (a, b) => {
      const enemy = (a && typeof a.takeDamage === 'function') ? a : ((b && typeof b.takeDamage === 'function') ? b : null);
      const bolt = enemy === a ? b : a;

      if (!enemy || !bolt || !bolt.active || enemy.isDead) return;

      const boltX = bolt.x;
      const boltY = bolt.y;
      bolt.destroy();
      soundFX.playExplosion();
      this.createMagicBurst(boltX, boltY, 0xa855f7);
      enemy.takeDamage(42, boltX);
    });

    this.physics.add.collider(this.playerBolts, this.platforms, (bolt) => {
      if (!bolt || !bolt.active) return;
      const boltX = bolt.x;
      const boltY = bolt.y;
      bolt.destroy();
      soundFX.playExplosion();
      this.createMagicBurst(boltX, boltY, 0xa855f7);
    });

    // Mona's Astral Rays vs Enemies (Pierces multiple foes)
    this.physics.add.overlap(this.astralRays, this.enemies, (a, b) => {
      const enemy = (a && typeof a.takeDamage === 'function') ? a : ((b && typeof b.takeDamage === 'function') ? b : null);
      const ray = enemy === a ? b : a;

      if (!enemy || !ray || !ray.active || enemy.isDead) return;

      const now = this.time.now;
      if (!enemy.lastHitTime || now - enemy.lastHitTime > 120) {
        enemy.lastHitTime = now;
        soundFX.playHit(true);
        this.createMagicBurst(enemy.x, enemy.y, 0x22d3ee);
        enemy.takeDamage(55, ray.x, 'astral_ray');
        this.player.gainSoul(12);
      }
    });

    // Mona's Astral Rays vs Arcane Crystal Pedestals
    this.physics.add.overlap(this.astralRays, this.arcanePedestals, (a, b) => {
      const ped = (a && a.bridgeConfig !== undefined) ? a : b;
      if (ped && !ped.activated) {
        this.activateArcanePedestal(ped);
      }
    });

    // Enemy Projectiles (Embers, Wisp Sparks, Magma Balls) vs Player
    this.physics.add.overlap(this.player, this.enemyEmbers, (a, b) => {
      const ember = (a === this.player) ? b : a;
      if (!ember || !ember.active) return;
      const emberX = ember.x;
      ember.destroy();
      this.player.takeDamage(16, emberX);
    });

    this.physics.add.collider(this.enemyEmbers, this.platforms, (ember) => {
      if (ember && ember.active) ember.destroy();
    });

    // Boss Shockwaves vs Player
    this.physics.add.overlap(this.player, this.bossShockwaves, (a, b) => {
      const wave = (a === this.player) ? b : a;
      if (wave && wave.active) {
        this.player.takeDamage(22, wave.x);
      }
    });

    // Player vs Soul Orbs
    this.physics.add.overlap(this.player, this.soulOrbs, (a, b) => {
      const orb = (a === this.player) ? b : a;
      if (!orb || !orb.active) return;
      const orbX = orb.x;
      const orbY = orb.y;
      orb.destroy();
      this.player.gainSoul(15);
      soundFX.playCollect();
      this.createMagicBurst(orbX, orbY, 0x2ce8f5);
    });

    // Player vs Enemies body contact damage
    this.physics.add.overlap(this.player, this.enemies, (a, b) => {
      const enemy = (a && typeof a.takeDamage === 'function') ? a : ((b && typeof b.takeDamage === 'function') ? b : null);
      if (enemy && !enemy.isDead && !this.player.isRolling) {
        this.player.takeDamage(12, enemy.x);
      }
    });
  }

  // --- SCENE UPDATE LOOP ---
  update() {
    const keys = { ...this.keys };
    if (this.touchControls.left) this.cursors.left.isDown = true;
    if (this.touchControls.right) this.cursors.right.isDown = true;

    if (this.gamepadManager) {
      this.gamepadManager.update();
      if (this.gamepadManager.justDown('pause')) {
        this.events.emit('toggle_pause');
      }
      if (this.gamepadManager.justDown('map')) {
        this.events.emit('toggle_map');
      }
    }

    // Capture interact input ONCE per frame so it is never consumed or lost
    let isInteractPressed = (this.keys.interact && Phaser.Input.Keyboard.JustDown(this.keys.interact)) || 
                            (this.keys.interactB && Phaser.Input.Keyboard.JustDown(this.keys.interactB)) ||
                            (this.keys.interactEnter && Phaser.Input.Keyboard.JustDown(this.keys.interactEnter)) ||
                            (this.cursors.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) || 
                            (this.gamepadManager && this.gamepadManager.justDown('interact'));

    // Update Parallax Backgrounds
    this.updateParallaxBackground();

    // Update Player (Keyboard + Gamepad)
    const executed = this.player.update(this.cursors, keys, this.gamepadManager, isInteractPressed);
    if (executed) {
      isInteractPressed = false; // consumed by combat execution
    }

    // Update Enemies
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy && enemy.update) {
        enemy.update(this.player);
      }
    });

    // -------------------------------------------------------------------------
    // Haven Campfire & Gathered Sisters Interaction (Prioritized Single Focus)
    // -------------------------------------------------------------------------
    const distToShrine = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shrine.x, this.shrine.y);

    // Find the closest visible gathered sister to the player
    let closestSister = null;
    let minSisterDist = 75; // generous interaction range

    Object.values(this.gatheredSisterSprites).forEach((entry) => {
      if (!entry.sprite || !entry.sprite.visible) {
        if (entry.prompt) entry.prompt.setAlpha(0);
        return;
      }
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.x, entry.y);
      if (d < minSisterDist) {
        minSisterDist = d;
        closestSister = entry;
      }
    });

    // Reset all prompts to invisible by default
    this.campfirePrompt.setAlpha(0);
    Object.values(this.gatheredSisterSprites).forEach((entry) => {
      if (entry.prompt) entry.prompt.setAlpha(0);
    });

    const isGamepad = this.gamepadManager && this.gamepadManager.activeInputType === 'gamepad';
    const keyHint = isGamepad ? '[B]' : '[E / B]';

    this.campfirePrompt.setText(`${keyHint} REST AT CAMPFIRE`);

    // Single Prioritized Focus:
    // If player is in talking range of a sister AND closer to her than to the shrine:
    if (closestSister && minSisterDist < distToShrine) {
      closestSister.prompt.setText(`${keyHint} TALK TO ${closestSister.data.name.toUpperCase()}`);
      closestSister.prompt.setAlpha(1);
      if (isInteractPressed) {
        this.talkToSister(closestSister.id);
      }
    } else if (distToShrine < 75) {
      // Close to campfire shrine and closer to campfire than any sister:
      this.campfirePrompt.setAlpha(1);
      if (isInteractPressed) {
        this.openCampfireHavenMenu();
      }
    }

    // Check Treasure Chest
    const distToChest = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y);
    if (distToChest < 50 && !this.chestOpened) {
      if (isInteractPressed) {
        this.openChest();
      }
    }

    // Check Imprisoned Sisters rescue interactions
    this.imprisonedSisters.forEach((sister) => {
      if (sister.rescued) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, sister.x, sister.y);
      if (d < 70) {
        sister.prompt.setText(`${keyHint} RESCUE ${sister.sisterData.name.toUpperCase()}`);
        sister.prompt.setAlpha(1);
        if (isInteractPressed) {
          this.rescueSister(sister);
        }
      } else {
        sister.prompt.setAlpha(0);
      }
    });

    // Phase 8: Check Astral Leyline Fast-Travel Interactions
    if (this.leylines) {
      this.leylines.forEach((stone) => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, stone.x, stone.y);
        if (d < 60) {
          if (!this.discoveredLeylineIds.has(stone.leylineId)) {
            this.discoveredLeylineIds.add(stone.leylineId);
            soundFX.playCollect();
            this.events.emit('show_toast', `✨ ASTRAL LEYLINE ACTIVATED: ${stone.leylineName.toUpperCase()}`);
          }
          stone.prompt.setText(`${keyHint} ASTRAL FAST-TRAVEL`);
          stone.prompt.setAlpha(1);
          if (isInteractPressed) {
            this.openLeylineFastTravelMenu();
          }
        } else {
          stone.prompt.setAlpha(0);
        }
      });
    }

    // Phase 8: Check Shortcut Portcullis Levers
    if (this.shortcutPortcullises) {
      this.shortcutPortcullises.forEach((item) => {
        const { gate, lever } = item;
        if (lever.isPulled) {
          lever.prompt.setAlpha(0);
          return;
        }
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, lever.x, lever.y);
        if (d < 50) {
          lever.prompt.setText(`${keyHint} PULL SHORTCUT LEVER`);
          lever.prompt.setAlpha(1);
          if (isInteractPressed) {
            lever.isPulled = true;
            lever.prompt.setAlpha(0);
            lever.setTexture('lever_switch_1');
            soundFX.playWallBreak();
            this.events.emit('show_toast', '⚙️ IRON PORTCULLIS SHORTCUT UNLOCKED!');
            if (gate && gate.body) {
              gate.body.enable = false;
            }
            if (gate) {
              this.tweens.add({
                targets: gate,
                y: gate.y - 96,
                alpha: 0.25,
                duration: 900,
                ease: 'Cubic.easeOut',
              });
            }
          }
        } else {
          lever.prompt.setAlpha(0);
        }
      });
    }

    // Phase 6.5: Check Relic Key Doors
    if (this.relicDoors) {
      this.relicDoors.getChildren().forEach((door) => {
        if (!door || !door.active || this.openedDoors.has(door.doorId)) {
          if (door.prompt) door.prompt.setAlpha(0);
          return;
        }
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x + 16, door.y + 48);
        if (d < 65) {
          const keyData = RELIC_KEYS[door.requiredKeyId];
          const hasKey = this.collectedKeys.has(door.requiredKeyId);
          const hasMonaPower = door.doorId === 'door_grotto_vault' && (this.player.abilities?.astralRay || this.rescuedSisterIds?.has('mona'));
          const canUnlock = hasKey || hasMonaPower;
          if (door.prompt) {
            if (canUnlock) {
              const method = hasKey ? `${keyData ? keyData.name.toUpperCase() : 'KEY'}` : "MONA'S ASTRAL RESONANCE";
              door.prompt.setText(`${keyHint} UNLOCK ${door.doorName.toUpperCase()} (${method})`);
            } else {
              door.prompt.setText(`🔒 LOCKED: REQUIRES ${keyData ? keyData.name.toUpperCase() : 'KEY'}`);
            }
            door.prompt.setAlpha(1);
          }
          if (isInteractPressed) {
            this.interactWithRelicDoor(door);
          }
        } else if (door.prompt) {
          door.prompt.setAlpha(0);
        }
      });
    }

    // Phase 8: Sub-Region Tracking & Spatial Notifications
    if (this.subRegionManager && this.player) {
      this.subRegionManager.update(this.player.x, this.player.y);
    }

    // Phase 6.5: Discrete Chamber Room Tracking, Camera Bounding & Lockdown Arenas
    if (this.roomManager && this.player) {
      this.roomManager.update(this.player.x, this.player.y);
    }
    this.updateCrumblingPlatforms();

    // Safety Net: Out-of-bounds abyss recovery
    if (this.player && this.player.y > 2420) {
      this.handlePitFall();
    }

    // Phase 8: Regional Biome Boss Arena Triggers
    if (this.bossOssian && !this.bossOssian.bossActive && !this.bossOssian.isDead &&
        this.player.x >= 2650 && this.player.x <= 3350 && this.player.y >= 1450 && this.player.y <= 1850) {
      this.bossOssian.activateBoss();
    }
    if (this.bossCaelith && !this.bossCaelith.bossActive && !this.bossCaelith.isDead &&
        this.player.x >= 1400 && this.player.x <= 2050 && this.player.y <= 400) {
      this.bossCaelith.activateBoss();
    }
    if (this.bossIgnis && !this.bossIgnis.bossActive && !this.bossIgnis.isDead &&
        this.player.x >= 3700 && this.player.x <= 4150 && this.player.y >= 1900 && this.player.y <= 2450) {
      this.bossIgnis.activateBoss();
    }
    if (this.bossZephyra && !this.bossZephyra.bossActive && !this.bossZephyra.isDead &&
        this.player.x >= 4050 && this.player.x <= 4400 && this.player.y <= 650) {
      this.bossZephyra.activateBoss();
    }

    // Biome Tracking & Mini-Map Updates
    const now = this.time.now;
    if (now - this.lastBiomeCheck > 120) {
      this.lastBiomeCheck = now;
      this.checkCurrentBiome();
    }

    // Check Boss Arena Trigger: strictly inside the Sanctum of the Void arena (X > 4540, Y between 1350 and 1650)
    if (!this.bossTriggered && this.player.x > 4540 && this.player.y >= 1350 && this.player.y <= 1650) {
      this.triggerBossEncounter();
    }
  }

  checkCurrentBiome() {
    const px = this.player.x;
    const py = this.player.y;

    let biome = 'catacombs';
    let biomeData = {
      name: 'The Whispering Catacombs',
      subtitle: 'Ancient Forgotten Undercroft',
      color: '#94a3b8',
    };

    if (px >= 4300 && py >= 1150) {
      biome = 'sanctum';
      biomeData = {
        name: 'The Sanctum of the Void',
        subtitle: 'Domain of Malakor the Abyssal Knight',
        color: '#c084fc',
      };
    } else if (py < 1150 && px < 2000) {
      biome = 'grotto';
      biomeData = {
        name: 'The Sunken Crystal Grotto',
        subtitle: 'Domain of the Astral Sorceress',
        color: '#22d3ee',
      };
    } else if (py < 1150 && px >= 2000) {
      biome = 'spire';
      biomeData = {
        name: 'The Howling Spire',
        subtitle: 'Pinnacle of the Tempest Winds',
        color: '#818cf8',
      };
    } else if (py >= 1650 && px >= 1400 && px < 4300) {
      biome = 'foundry';
      biomeData = {
        name: 'The Molten Foundry',
        subtitle: 'Iron Forge of the Indomitable Aegis',
        color: '#f97316',
      };
    }

    // Notify UI of position & biome
    this.events.emit('player_moved', { x: px, y: py, biome });

    if (biome !== this.currentBiome) {
      this.currentBiome = biome;
      this.events.emit('biome_discovered', biomeData);
    }
  }

  // --- VISUAL FX HELPERS ---
  createMagicBurst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 6), color);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(60, 160);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(300, 500),
        onComplete: () => p.destroy(),
      });
    }
  }

  createDustPuff(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x + Phaser.Math.Between(-10, 10), y, 3, 0x64748b, 0.6);
      this.tweens.add({
        targets: p,
        y: y - 14,
        alpha: 0,
        duration: 250,
        onComplete: () => p.destroy(),
      });
    }
  }

  createDamageNumber(x, y, text, color = '#ffffff') {
    const num = this.add.text(x, y, text, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: typeof text === 'number' && text >= 35 ? '18px' : '14px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: num,
      y: y - 35,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => num.destroy(),
    });
  }

  // =========================================================================
  // PHASE 7: HACK-AND-SLASH COMBAT EVOLUTION & SISTER TAG-TEAM ASSISTS
  // =========================================================================
  spawnDiveShockwave(x, y) {
    const shockwave = this.add.image(x, y - 8, 'dive_shockwave').setDepth(15);
    shockwave.setScale(0.5, 0.5);
    shockwave.setAlpha(1);

    this.tweens.add({
      targets: shockwave,
      scaleX: 2.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => shockwave.destroy(),
    });

    // Damage and stagger enemies in radius
    this.enemies.getChildren().forEach((e) => {
      if (e && e.active && !e.isDead) {
        const dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
        if (dist <= 140) {
          e.takeDamage(65, x, 'dive_impact');
          if (e.stagger) e.stagger(1500);
          this.createMagicBurst(e.x, e.y, 0xf97316);
        }
      }
    });
  }

  spawnParrySpark(x, y) {
    const spark = this.add.image(x, y, 'parry_shield_spark').setDepth(20);
    spark.setScale(0.8);
    this.tweens.add({
      targets: spark,
      scale: 1.8,
      alpha: 0,
      rotation: Math.PI / 4,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => spark.destroy(),
    });
  }

  triggerSisterAssist(sisterId, px, py) {
    if (sisterId === 'mona') {
      // Mona Assist: Starlight Prism Nova (Freezes all nearby enemies in ice crystals)
      soundFX.playCrystalActivate();
      this.cameras.main.shake(250, 0.015);
      this.events.emit('show_toast', '✨ SISTER ASSIST: MONA — STARLIGHT PRISM STASIS!');
      this.createMagicBurst(px, py, 0x06b6d4);

      this.enemies.getChildren().forEach((e) => {
        if (e && e.active && !e.isDead && Phaser.Math.Distance.Between(px, py, e.x, e.y) < 420) {
          if (e.freeze) e.freeze(3200);
          const prism = this.add.image(e.x, e.y - 10, 'starlight_prism_crystal').setDepth(18);
          this.tweens.add({
            targets: prism,
            alpha: 0,
            scale: 1.3,
            duration: 3200,
            onComplete: () => prism.destroy(),
          });
        }
      });
    } else if (sisterId === 'percy') {
      // Percy Assist: Titan Aegis Quake (Stuns and crushes all ground enemies)
      soundFX.playWallBreak();
      this.cameras.main.shake(350, 0.022);
      this.events.emit('show_toast', '🛡️ SISTER ASSIST: PERCY — TITAN AEGIS QUAKE!');
      this.createMagicBurst(px, py, 0xf59e0b);

      this.enemies.getChildren().forEach((e) => {
        if (e && e.active && !e.isDead && Phaser.Math.Distance.Between(px, py, e.x, e.y) < 400) {
          e.takeDamage(75, px, 'titan_quake');
          if (e.stagger) e.stagger(2200);
          this.createDamageNumber(e.x, e.y - 30, 'TITAN STUN!', '#f59e0b');
        }
      });
    } else if (sisterId === 'tilly') {
      // Tilly Assist: Shadow Snare Whiplash (Pulls distant enemies to player and roots them)
      soundFX.playSlash(3);
      this.cameras.main.shake(200, 0.012);
      this.events.emit('show_toast', '⛓️ SISTER ASSIST: TILLY — SHADOW SNARE TETHER!');
      this.createMagicBurst(px, py, 0x10b981);

      this.enemies.getChildren().forEach((e) => {
        if (e && e.active && !e.isDead && Phaser.Math.Distance.Between(px, py, e.x, e.y) < 450) {
          e.takeDamage(50, px, 'snare_whip');
          if (e.body) {
            const pullDir = px > e.x ? 1 : -1;
            e.body.setVelocityX(pullDir * 300);
          }
          if (e.stagger) e.stagger(1400);
        }
      });
    } else {
      // Wren Assist: Zephyr Cyclone Blade (Spinning vortex blade slices through enemies)
      soundFX.playRoll();
      this.cameras.main.shake(250, 0.015);
      this.events.emit('show_toast', '🌪️ SISTER ASSIST: WREN — ZEPHYR CYCLONE BLADE!');

      const facingDir = this.player.facing === 'right' ? 1 : -1;
      const blade = this.physics.add.sprite(px + facingDir * 40, py, 'cyclone_blade').setDepth(16);
      blade.body.setAllowGravity(false);
      blade.body.setVelocityX(facingDir * 320);

      this.tweens.add({
        targets: blade,
        angle: 720,
        duration: 900,
        repeat: 1,
      });

      this.physics.add.overlap(blade, this.enemies, (b, e) => {
        if (e && e.active && !e.isDead) {
          e.takeDamage(45, b.x, 'cyclone');
          if (e.juggleFloat) e.juggleFloat(240);
          this.createMagicBurst(e.x, e.y, 0x38bdf8);
        }
      });

      this.time.delayedCall(1600, () => {
        if (blade.active) blade.destroy();
      });
    }
  }
}

import { SisterSpriteGenerator } from './SisterSpriteGenerator.js';

export class SpriteGenerator {
  static createAllTextures(scene) {
    this.createPlayerTextures(scene);
    SisterSpriteGenerator.createAllSisterTextures(scene);
    this.createSkeletonTextures(scene);
    this.createGargoyleTextures(scene);
    this.createBossTextures(scene);
    this.createEnvironmentTextures(scene);
    this.createFXTextures(scene);
    this.createPhase2Textures(scene);
    this.createPhase3Textures(scene);
    this.createPhase4Textures(scene);
    this.createPhase5Textures(scene);
    this.createPhase8Textures(scene);
    this.createPhase6_5Textures(scene);
    this.createPhase7Textures(scene);
  }

  // Helper to make canvas and add to Phaser texture cache
  static makeCanvas(scene, key, width, height, drawFn) {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    scene.textures.addCanvas(key, canvas);
  }

  // --- PLAYER TEXTURES ---
  // Player size: 48x64 px (drawn with dark hood, purple/crimson scarf, runic armor, glowing blade)
  static createPlayerTextures(scene) {
    // 1. Player Idle (frames 1 & 2 for subtle breathing)
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `player_idle_${f}`, 48, 64, (ctx) => {
        const breathY = f === 1 ? -1 : 0;

        // Shadow under feet
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(24, 62, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark cape / cloak back
        ctx.fillStyle = '#181425';
        ctx.beginPath();
        ctx.moveTo(18, 26 + breathY);
        ctx.lineTo(30, 26 + breathY);
        ctx.lineTo(34, 58);
        ctx.lineTo(14, 58);
        ctx.closePath();
        ctx.fill();

        // Legs / Boots
        ctx.fillStyle = '#262b44';
        ctx.fillRect(18, 48, 5, 14);
        ctx.fillRect(25, 48, 5, 14);
        ctx.fillStyle = '#3a4466';
        ctx.fillRect(17, 58, 6, 4);
        ctx.fillRect(25, 58, 6, 4);

        // Armor Torso
        ctx.fillStyle = '#3a4466';
        ctx.fillRect(18, 28 + breathY, 12, 20);
        // Silver breastplate highlights
        ctx.fillStyle = '#8b9bb4';
        ctx.fillRect(20, 30 + breathY, 8, 12);
        ctx.fillStyle = '#c0cbdc';
        ctx.fillRect(22, 32 + breathY, 4, 8);

        // Crimson Runic Scarf / Cape front
        ctx.fillStyle = '#8f1e3c';
        ctx.beginPath();
        ctx.moveTo(16, 24 + breathY);
        ctx.lineTo(32, 24 + breathY);
        ctx.lineTo(28, 38 + breathY);
        ctx.lineTo(18, 36 + breathY);
        ctx.closePath();
        ctx.fill();

        // Scarf trailing tail
        ctx.fillStyle = '#a62649';
        ctx.beginPath();
        ctx.moveTo(17, 30 + breathY);
        ctx.lineTo(10 - f * 2, 42 + breathY);
        ctx.lineTo(15, 38 + breathY);
        ctx.closePath();
        ctx.fill();

        // Hood & Head
        ctx.fillStyle = '#181425';
        ctx.beginPath();
        ctx.arc(24, 20 + breathY, 9, 0, Math.PI * 2);
        ctx.fill();

        // Hood face shadow
        ctx.fillStyle = '#0f0b18';
        ctx.beginPath();
        ctx.arc(25, 20 + breathY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Amethyst/Cyan eye
        ctx.fillStyle = '#2ce8f5';
        ctx.shadowColor = '#2ce8f5';
        ctx.shadowBlur = 6;
        ctx.fillRect(26, 18 + breathY, 3, 2);
        ctx.shadowBlur = 0;

        // Greatsword sheathed on back or resting at side
        ctx.strokeStyle = '#c0cbdc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(14, 22 + breathY);
        ctx.lineTo(8, 52 + breathY);
        ctx.stroke();
        // Crossguard & Pommel
        ctx.fillStyle = '#e4a672';
        ctx.fillRect(11, 24 + breathY, 7, 3);
        ctx.fillStyle = '#733e39';
        ctx.fillRect(13, 20 + breathY, 3, 4);
      });
    });

    // 2. Player Run (4 frames)
    [0, 1, 2, 3].forEach((f) => {
      this.makeCanvas(scene, `player_run_${f}`, 48, 64, (ctx) => {
        const bob = f % 2 === 1 ? -2 : 0;
        const legAngle = [20, -15, -20, 15][f];

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(24, 62, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dynamic flowing cape
        ctx.fillStyle = '#181425';
        ctx.beginPath();
        ctx.moveTo(20, 26 + bob);
        ctx.lineTo(30, 26 + bob);
        ctx.lineTo(10 - f * 3, 46);
        ctx.lineTo(14, 54);
        ctx.closePath();
        ctx.fill();

        // Legs animated
        ctx.fillStyle = '#262b44';
        // Left leg
        ctx.fillRect(20 + legAngle * 0.3, 46 + bob, 5, 14);
        // Right leg
        ctx.fillRect(25 - legAngle * 0.3, 46 + bob, 5, 14);

        // Torso leaned slightly forward
        ctx.fillStyle = '#3a4466';
        ctx.fillRect(20, 28 + bob, 12, 18);
        ctx.fillStyle = '#8b9bb4';
        ctx.fillRect(22, 30 + bob, 8, 10);

        // Crimson scarf blowing back
        ctx.fillStyle = '#8f1e3c';
        ctx.beginPath();
        ctx.moveTo(18, 24 + bob);
        ctx.lineTo(34, 24 + bob);
        ctx.lineTo(28, 36 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#a62649';
        ctx.beginPath();
        ctx.moveTo(16, 28 + bob);
        ctx.lineTo(6 - f * 2, 34 + bob);
        ctx.lineTo(14, 34 + bob);
        ctx.closePath();
        ctx.fill();

        // Hood
        ctx.fillStyle = '#181425';
        ctx.beginPath();
        ctx.arc(26, 20 + bob, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f0b18';
        ctx.beginPath();
        ctx.arc(27, 20 + bob, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye glow
        ctx.fillStyle = '#2ce8f5';
        ctx.shadowColor = '#2ce8f5';
        ctx.shadowBlur = 6;
        ctx.fillRect(28, 18 + bob, 3, 2);
        ctx.shadowBlur = 0;

        // Greatsword in hand angled
        ctx.strokeStyle = '#c0cbdc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(28, 36 + bob);
        ctx.lineTo(38 + legAngle * 0.2, 50 + bob);
        ctx.stroke();
      });
    });

    // 3. Player Jump & Fall
    ['jump', 'fall'].forEach((state) => {
      this.makeCanvas(scene, `player_${state}`, 48, 64, (ctx) => {
        const isJump = state === 'jump';
        // Flapping cape
        ctx.fillStyle = '#181425';
        ctx.beginPath();
        ctx.moveTo(18, 24);
        ctx.lineTo(30, 24);
        ctx.lineTo(isJump ? 8 : 12, 54);
        ctx.lineTo(24, 52);
        ctx.closePath();
        ctx.fill();

        // Tucked legs
        ctx.fillStyle = '#262b44';
        ctx.fillRect(18, 44, 5, 10);
        ctx.fillRect(25, 42, 5, 12);

        // Torso
        ctx.fillStyle = '#3a4466';
        ctx.fillRect(18, 26, 12, 18);
        ctx.fillStyle = '#8b9bb4';
        ctx.fillRect(20, 28, 8, 10);

        // Scarf
        ctx.fillStyle = '#8f1e3c';
        ctx.fillRect(16, 22, 16, 6);

        // Hood
        ctx.fillStyle = '#181425';
        ctx.beginPath();
        ctx.arc(24, 18, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f0b18';
        ctx.beginPath();
        ctx.arc(25, 18, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2ce8f5';
        ctx.shadowColor = '#2ce8f5';
        ctx.shadowBlur = 6;
        ctx.fillRect(26, 16, 3, 2);
        ctx.shadowBlur = 0;

        // Sword raised or pointing down
        ctx.strokeStyle = '#c0cbdc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isJump) {
          ctx.moveTo(30, 26);
          ctx.lineTo(44, 12);
        } else {
          ctx.moveTo(30, 36);
          ctx.lineTo(42, 56);
        }
        ctx.stroke();
      });
    });

    // 4. Player Attacks (3-hit Combo frames)
    // Attack 1: Horizontal slash
    this.makeCanvas(scene, 'player_slash_1', 64, 64, (ctx) => {
      // Body stepped forward
      ctx.fillStyle = '#181425';
      ctx.beginPath();
      ctx.arc(28, 20, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a4466';
      ctx.fillRect(22, 28, 14, 20);
      // Eye
      ctx.fillStyle = '#2ce8f5';
      ctx.fillRect(30, 18, 3, 2);

      // Legs lunging
      ctx.fillStyle = '#262b44';
      ctx.fillRect(16, 48, 6, 14);
      ctx.fillRect(32, 48, 7, 14);

      // Sword extended horizontally with brilliant glow
      ctx.shadowColor = '#2ce8f5';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(28, 34);
      ctx.lineTo(58, 32);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Energy slash wave
      ctx.strokeStyle = 'rgba(44, 232, 245, 0.7)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(30, 32, 26, -0.4, 0.4);
      ctx.stroke();
    });

    // Attack 2: Upward cleave
    this.makeCanvas(scene, 'player_slash_2', 64, 64, (ctx) => {
      ctx.fillStyle = '#181425';
      ctx.beginPath();
      ctx.arc(26, 22, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a4466';
      ctx.fillRect(20, 30, 14, 18);
      ctx.fillStyle = '#2ce8f5';
      ctx.fillRect(28, 20, 3, 2);

      // Legs
      ctx.fillStyle = '#262b44';
      ctx.fillRect(18, 48, 6, 14);
      ctx.fillRect(28, 48, 6, 14);

      // Upward blade
      ctx.shadowColor = '#8f1e3c';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(26, 36);
      ctx.lineTo(52, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Arc
      ctx.strokeStyle = 'rgba(235, 76, 114, 0.75)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(28, 32, 28, -1.2, 0.2);
      ctx.stroke();
    });

    // Attack 3: Heavy Overhand Smite / Spin
    this.makeCanvas(scene, 'player_slash_3', 64, 64, (ctx) => {
      ctx.fillStyle = '#181425';
      ctx.beginPath();
      ctx.arc(28, 24, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a4466';
      ctx.fillRect(22, 32, 14, 18);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(30, 22, 4, 3);

      // Legs planted deep
      ctx.fillStyle = '#262b44';
      ctx.fillRect(14, 50, 8, 12);
      ctx.fillRect(34, 50, 8, 12);

      // Massive downward sword slam
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(28, 30);
      ctx.lineTo(60, 52);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Large arc
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(32, 36, 30, -0.2, 1.4);
      ctx.stroke();
    });

    // 5. Player Dodge Roll / Shadow Dash (48x64 to match standard character bounds)
    this.makeCanvas(scene, 'player_roll', 48, 64, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(24, 62, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer shadow burst
      ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
      ctx.beginPath();
      ctx.arc(24, 38, 20, 0, Math.PI * 2);
      ctx.fill();

      // Dark swirling cloaks
      ctx.fillStyle = '#181425';
      ctx.beginPath();
      ctx.arc(24, 38, 15, 0, Math.PI * 2);
      ctx.fill();

      // Neon trails inside roll
      ctx.strokeStyle = '#2ce8f5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(24, 38, 11, 0, Math.PI * 1.5);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(22, 36, 4, 4);
    });

    // 6. Player Cast Spell
    this.makeCanvas(scene, 'player_cast', 48, 64, (ctx) => {
      ctx.fillStyle = '#181425';
      ctx.beginPath();
      ctx.arc(24, 20, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a4466';
      ctx.fillRect(18, 28, 12, 20);
      ctx.fillStyle = '#262b44';
      ctx.fillRect(18, 48, 5, 14);
      ctx.fillRect(25, 48, 5, 14);

      // Glowing hands holding magic orb
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(36, 28, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(36, 28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 7. Player Hurt
    this.makeCanvas(scene, 'player_hurt', 48, 64, (ctx) => {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(22, 20, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(16, 28, 12, 20);
      ctx.fillRect(16, 48, 5, 14);
      ctx.fillRect(23, 48, 5, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(22, 18, 3, 3);
    });
  }

  // --- SKELETON KNIGHT ---
  // Armored skeleton with iron cleaver & glowing red sockets (48x56 px)
  static createSkeletonTextures(scene) {
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `skel_walk_${f}`, 48, 56, (ctx) => {
        const bob = f === 1 ? -2 : 0;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(24, 54, 14, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ribs / Bones
        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(20, 24 + bob, 8, 14);
        ctx.fillStyle = '#374151'; // gaps between ribs
        ctx.fillRect(20, 27 + bob, 8, 2);
        ctx.fillRect(20, 32 + bob, 8, 2);

        // Legs (bony)
        ctx.fillStyle = '#e5e7eb';
        const legShift = f === 1 ? 4 : -4;
        ctx.fillRect(19 + legShift, 38, 3, 16);
        ctx.fillRect(26 - legShift, 38, 3, 16);

        // Armored Horned Skull
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.arc(24, 16 + bob, 8, 0, Math.PI * 2);
        ctx.fill();

        // Rusty iron helmet
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(18, 10 + bob, 12, 6);
        // Horns
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(17, 12 + bob);
        ctx.lineTo(12, 6 + bob);
        ctx.lineTo(19, 10 + bob);
        ctx.fill();

        // Glowing red eye sockets
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillRect(25, 15 + bob, 3, 2);
        ctx.shadowBlur = 0;

        // Cleaver blade
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(32, 22 + bob, 5, 18);
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(30, 36 + bob, 9, 3);
      });
    });

    // Skeleton attack swing
    this.makeCanvas(scene, 'skel_attack', 56, 56, (ctx) => {
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.arc(22, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(24, 15, 3, 2);

      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(18, 24, 8, 14);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(16, 38, 4, 16);
      ctx.fillRect(26, 38, 4, 16);

      // Cleaver swung forward with blood trail
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(30, 24, 22, 6);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(30, 25, 18, 4);
    });
  }

  // --- SHADOW GARGOYLE ---
  // Flying winged demon (40x36 px)
  static createGargoyleTextures(scene) {
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `gargoyle_fly_${f}`, 44, 40, (ctx) => {
        const wingY = f === 1 ? -4 : 4;

        // Wings
        ctx.fillStyle = '#3730a3';
        ctx.beginPath();
        ctx.moveTo(22, 20);
        ctx.lineTo(6, 6 + wingY);
        ctx.lineTo(14, 24);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(22, 20);
        ctx.lineTo(38, 6 + wingY);
        ctx.lineTo(30, 24);
        ctx.fill();

        // Dark demonic body
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(22, 20, 8, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(18, 12, 2, 4);
        ctx.fillRect(24, 12, 2, 4);

        // Glowing cyan eye
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.fillRect(21, 18, 3, 3);
        ctx.shadowBlur = 0;
      });
    });
  }

  // --- BOSS: MALAKOR, THE ABYSSAL KNIGHT ---
  // Imposing 96x96 px gothic armored lord with a giant glowing Zweihänder
  static createBossTextures(scene) {
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `boss_idle_${f}`, 96, 96, (ctx) => {
        const breath = f === 1 ? -2 : 0;
        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(48, 92, 32, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ragged shredded cape
        ctx.fillStyle = '#1e102d';
        ctx.beginPath();
        ctx.moveTo(34, 38 + breath);
        ctx.lineTo(62, 38 + breath);
        ctx.lineTo(72, 88);
        ctx.lineTo(24, 88);
        ctx.fill();

        // Legs / Heavy Greaves
        ctx.fillStyle = '#261b36';
        ctx.fillRect(36, 68, 10, 24);
        ctx.fillRect(50, 68, 10, 24);
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(35, 84, 12, 8);
        ctx.fillRect(49, 84, 12, 8);

        // Huge Torso Armor
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(34, 40 + breath, 28, 30);
        // Abyssal purple core reactor glowing in chest
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(48, 52 + breath, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(48, 52 + breath, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spiked Pauldrons (Shoulders)
        ctx.fillStyle = '#311042';
        ctx.beginPath();
        ctx.moveTo(28, 38 + breath);
        ctx.lineTo(34, 28 + breath);
        ctx.lineTo(38, 44 + breath);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(68, 38 + breath);
        ctx.lineTo(62, 28 + breath);
        ctx.lineTo(58, 44 + breath);
        ctx.fill();

        // Crowned Helm
        ctx.fillStyle = '#181024';
        ctx.fillRect(40, 24 + breath, 16, 18);
        // Spiked Crown
        ctx.fillStyle = '#7e22ce';
        ctx.beginPath();
        ctx.moveTo(38, 24 + breath);
        ctx.lineTo(42, 16 + breath);
        ctx.lineTo(48, 22 + breath);
        ctx.lineTo(54, 16 + breath);
        ctx.lineTo(58, 24 + breath);
        ctx.fill();

        // Visor glow
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;
        ctx.fillRect(44, 30 + breath, 10, 3);
        ctx.shadowBlur = 0;

        // Massive Zweihänder sword resting in hand
        ctx.strokeStyle = '#c084fc';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(64, 46 + breath);
        ctx.lineTo(84, 88 + breath);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    });

    // Boss Attack - Ground Slam
    this.makeCanvas(scene, 'boss_slam', 96, 96, (ctx) => {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(36, 46, 28, 30);
      ctx.fillStyle = '#181024';
      ctx.fillRect(40, 30, 16, 18);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(44, 36, 10, 3);

      // Sword slammed into ground with huge purple lightning
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(48, 36);
      ctx.lineTo(76, 92);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Shockwave burst at ground point
      ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
      ctx.beginPath();
      ctx.arc(76, 92, 16, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // --- ENVIRONMENT TILES & PROPS ---
  static createEnvironmentTextures(scene) {
    // 1. High-Detail Chiseled Gothic Stone Brick Tile (32x32)
    this.makeCanvas(scene, 'tile_stone', 32, 32, (ctx) => {
      // Base deep slate gradient
      const baseGrad = ctx.createLinearGradient(0, 0, 0, 32);
      baseGrad.addColorStop(0, '#24283b');
      baseGrad.addColorStop(1, '#131520');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, 32, 32);

      // Deep recessed mortar lines
      ctx.fillStyle = '#090a10';
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(15, 0, 2, 15);
      ctx.fillRect(8, 16, 2, 16);
      ctx.fillRect(24, 16, 2, 16);

      // Top stone block chiseled bevels
      ctx.fillStyle = '#3f4663';
      ctx.fillRect(0, 0, 15, 2);
      ctx.fillRect(17, 0, 15, 2);
      ctx.fillRect(0, 17, 8, 1.5);
      ctx.fillRect(10, 17, 14, 1.5);
      ctx.fillRect(26, 17, 6, 1.5);

      // Subtle surface stone cracks & chisel pits
      ctx.fillStyle = '#10121a';
      ctx.fillRect(5, 6, 4, 1.5);
      ctx.fillRect(20, 8, 5, 1.5);
      ctx.fillRect(13, 22, 4, 1.5);

      // Top green velvety moss clumps on ground surface
      ctx.fillStyle = '#059669';
      ctx.fillRect(2, 0, 5, 3);
      ctx.fillRect(18, 0, 6, 2.5);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(3, 0, 3, 1.5);
      ctx.fillRect(20, 0, 3, 1.5);
    });

    // 2. Ornate Runic Floating Platform Tile (32x32)
    this.makeCanvas(scene, 'tile_platform', 32, 32, (ctx) => {
      // Dark enchanted obsidian slab
      const slabGrad = ctx.createLinearGradient(0, 0, 0, 32);
      slabGrad.addColorStop(0, '#2b2347');
      slabGrad.addColorStop(1, '#110f22');
      ctx.fillStyle = slabGrad;
      ctx.fillRect(0, 0, 32, 32);

      // Glowing Runic Inlay along top surface
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, 0, 32, 4);
      ctx.shadowBlur = 0;

      // Bright celestial core line
      ctx.fillStyle = '#c7d2fe';
      ctx.fillRect(3, 1, 26, 2);

      // Carved rune glyphs along face
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(6, 8, 4, 2);
      ctx.fillRect(8, 10, 2, 6);
      ctx.fillRect(22, 8, 4, 2);
      ctx.fillRect(22, 10, 2, 6);

      // Gothic bottom corbel arch & shadow
      ctx.fillStyle = '#080612';
      ctx.beginPath();
      ctx.arc(16, 32, 12, Math.PI, 0);
      ctx.fill();
    });

    // 3. Menacing Forged Steel Spikes Hazard (32x32)
    this.makeCanvas(scene, 'spikes', 32, 32, (ctx) => {
      // Dark iron base bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 28, 32, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 28, 32, 1);

      // 3 razor sharp triangular steel spikes
      for (let i = 0; i < 3; i++) {
        const x = i * 10 + 1;

        // Dark side shadow
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(x + 5, 4);
        ctx.lineTo(x + 10, 28);
        ctx.lineTo(x + 5, 28);
        ctx.closePath();
        ctx.fill();

        // Bright lit face
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x + 5, 4);
        ctx.lineTo(x, 28);
        ctx.lineTo(x + 5, 28);
        ctx.closePath();
        ctx.fill();

        // Razor specular edge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 5, 4);
        ctx.lineTo(x + 5, 28);
        ctx.stroke();

        // Lethal crimson poison / blood sheen on tips
        ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
        ctx.beginPath();
        ctx.moveTo(x + 5, 4);
        ctx.lineTo(x + 2, 15);
        ctx.lineTo(x + 8, 15);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Ambient Lighting Textures (Soft Radial Halos for Dynamic Scene Lighting)
    // Warm Torch / Campfire Glow (128x128)
    this.makeCanvas(scene, 'light_glow_warm', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.35)');
      grad.addColorStop(0.7, 'rgba(217, 119, 6, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cool Crystal / Astral Shrine Glow (128x128)
    this.makeCanvas(scene, 'light_glow_cool', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, 'rgba(165, 243, 252, 0.7)');
      grad.addColorStop(0.3, 'rgba(34, 211, 238, 0.35)');
      grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
    });

    // Molten Magma Glow (128x128)
    this.makeCanvas(scene, 'light_glow_magma', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, 'rgba(254, 215, 170, 0.7)');
      grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.4)');
      grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
    });

    // Floating Ambient Dust / Spore Mote (8x8)
    this.makeCanvas(scene, 'dust_mote', 8, 8, (ctx) => {
      const grad = ctx.createRadialGradient(4, 4, 1, 4, 4, 4);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.6, 'rgba(192, 132, 252, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(4, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Wall Torch (16x32) with 3 frames
    [0, 1, 2].forEach((f) => {
      this.makeCanvas(scene, `torch_${f}`, 16, 32, (ctx) => {
        // Sconce
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(6, 16, 4, 14);
        ctx.fillRect(4, 14, 8, 4);

        // Animated Flame
        const flameShift = (f - 1) * 2;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(8 + flameShift, 10, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(8 + flameShift * 0.5, 9, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 5. Bonfire / Ancient Shrine (48x48)
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `shrine_${f}`, 48, 48, (ctx) => {
        // Stone pedestal
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(8, 36, 32, 12);
        ctx.fillStyle = '#312e81';
        ctx.fillRect(12, 32, 24, 6);

        // Sword plunged in stone (Dark Souls bonfire homage)
        ctx.strokeStyle = '#c0cbdc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(24, 14);
        ctx.lineTo(24, 36);
        ctx.stroke();
        ctx.fillStyle = '#e4a672';
        ctx.fillRect(20, 16, 8, 3);

        // Mystical Soul Flame (cyan/amethyst)
        const size = f === 1 ? 12 : 14;
        ctx.fillStyle = 'rgba(44, 232, 245, 0.8)';
        ctx.shadowColor = '#2ce8f5';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(24, 24, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(24, 24, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });

    // 6. Treasure Chest (32x32)
    this.makeCanvas(scene, 'chest', 32, 32, (ctx) => {
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(4, 12, 24, 18);
      // Gold rims & lock
      ctx.fillStyle = '#eab308';
      ctx.fillRect(4, 12, 24, 3);
      ctx.fillRect(4, 20, 24, 2);
      ctx.fillRect(14, 16, 4, 6);
    });

    // 7. Background: The Whispering Catacombs / Cathedral Citadel (1200x800 High-Detail Panorama)
    this.makeCanvas(scene, 'bg_citadel', 1200, 800, (ctx) => {
      // Deep gothic crypt & night sky vertical gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 800);
      skyGrad.addColorStop(0, '#06050e');
      skyGrad.addColorStop(0.35, '#0e0b1d');
      skyGrad.addColorStop(0.7, '#181129');
      skyGrad.addColorStop(1, '#08060f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Blood Moon high in the crypt's open ceiling aperture
      const moonGrad = ctx.createRadialGradient(880, 140, 10, 880, 140, 52);
      moonGrad.addColorStop(0, '#fecdd3');
      moonGrad.addColorStop(0.4, '#e11d48');
      moonGrad.addColorStop(0.85, '#9f1239');
      moonGrad.addColorStop(1, 'rgba(159, 18, 57, 0)');
      ctx.fillStyle = moonGrad;
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 45;
      ctx.beginPath();
      ctx.arc(880, 140, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark clouds drifting across moon
      ctx.fillStyle = 'rgba(14, 11, 29, 0.75)';
      ctx.beginPath();
      ctx.ellipse(890, 150, 75, 16, -0.08, 0, Math.PI * 2);
      ctx.ellipse(840, 120, 60, 14, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Monumental Gothic Cathedral Spires & Flying Buttresses in distance
      ctx.fillStyle = '#0a0815';
      const farSpires = [
        [60, 180, 45, 620],
        [160, 110, 60, 690],
        [280, 220, 50, 580],
        [420, 150, 70, 650],
        [640, 90, 85, 710],
        [780, 190, 55, 610],
        [980, 130, 75, 670],
        [1110, 210, 50, 590],
      ];
      farSpires.forEach(([sx, sy, sw, sh]) => {
        // Pointed pinnacle cap
        ctx.beginPath();
        ctx.moveTo(sx + sw / 2, sy - 50);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + sw, sy);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(sx, sy, sw, sh);

        // Flying buttress arch
        ctx.strokeStyle = '#0a0815';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(sx - 20, sy + 60, 40, -Math.PI * 0.4, 0);
        ctx.stroke();
      });

      // Distant illuminated cathedral lancet windows
      const windowCols = ['#f59e0b', '#fbbf24', '#f43f5e', '#a855f7'];
      [
        [180, 220, 20, 55],
        [445, 260, 22, 60],
        [670, 210, 26, 75],
        [1005, 240, 22, 60],
      ].forEach(([wx, wy, ww, wh], idx) => {
        ctx.fillStyle = windowCols[idx % windowCols.length];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
        ctx.rect(wx, wy + ww / 2, ww, wh - ww / 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Window stone tracery crossbars
        ctx.strokeStyle = '#0a0815';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx + ww / 2, wy);
        ctx.lineTo(wx + ww / 2, wy + wh);
        ctx.moveTo(wx, wy + wh * 0.45);
        ctx.lineTo(wx + ww, wy + wh * 0.45);
        ctx.stroke();
      });

      // Grand Gothic Vaulted Stone Colonnades & Arches (Closer Depth Layer)
      ctx.fillStyle = '#0e0b19';
      for (let ax = 0; ax < 1200; ax += 300) {
        // Massive stone column
        ctx.fillRect(ax + 20, 260, 55, 540);
        // Column base and capital corbels
        ctx.fillRect(ax + 10, 250, 75, 18);
        ctx.fillRect(ax + 8, 760, 80, 40);

        // Pointed gothic rib vault arch bridging columns
        ctx.beginPath();
        ctx.moveTo(ax + 75, 270);
        ctx.quadraticCurveTo(ax + 170, 160, ax + 245, 270);
        ctx.lineTo(ax + 245, 305);
        ctx.quadraticCurveTo(ax + 170, 195, ax + 75, 305);
        ctx.closePath();
        ctx.fill();
      }

      // Ornate central Rose Window in the mid-ground
      const rwx = 600;
      const rwy = 360;
      const rwRadius = 75;

      // Outer stone ring
      ctx.strokeStyle = '#181329';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(rwx, rwy, rwRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Stained glass luminous backglow
      const roseGrad = ctx.createRadialGradient(rwx, rwy, 10, rwx, rwy, rwRadius);
      roseGrad.addColorStop(0, 'rgba(244, 63, 94, 0.55)');
      roseGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.45)');
      roseGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = roseGrad;
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(rwx, rwy, rwRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Rose window intricate stone tracery petals
      ctx.strokeStyle = '#0e0b19';
      ctx.lineWidth = 2.5;
      for (let p = 0; p < 8; p++) {
        const rad = (p * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(rwx, rwy);
        ctx.lineTo(rwx + Math.cos(rad) * rwRadius, rwy + Math.sin(rad) * rwRadius);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rwx + Math.cos(rad) * 45, rwy + Math.sin(rad) * 45, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Volumetric light shafts streaming through the vaulted arches
      const beamGrad = ctx.createLinearGradient(rwx - 100, rwy - 50, rwx + 200, 800);
      beamGrad.addColorStop(0, 'rgba(244, 63, 94, 0.12)');
      beamGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.06)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(rwx - 60, rwy);
      ctx.lineTo(rwx + 60, rwy);
      ctx.lineTo(rwx + 340, 800);
      ctx.lineTo(rwx - 120, 800);
      ctx.closePath();
      ctx.fill();

      // Atmospheric Ground Mist across the crypt floor
      const mistGrad = ctx.createLinearGradient(0, 680, 0, 800);
      mistGrad.addColorStop(0, 'rgba(24, 17, 41, 0)');
      mistGrad.addColorStop(1, 'rgba(24, 17, 41, 0.7)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 680, 1200, 120);
    });
  }

  // --- FX TEXTURES (Projectiles, Particles, Waves) ---
  static createFXTextures(scene) {
    // 1. Soul Bolt projectile (spinning magic sphere)
    this.makeCanvas(scene, 'soul_bolt', 24, 24, (ctx) => {
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(12, 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, 12, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Gargoyle Spat Ember projectile
    this.makeCanvas(scene, 'ember_proj', 16, 16, (ctx) => {
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(8, 8, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Boss Ground Shockwave
    this.makeCanvas(scene, 'boss_shockwave', 32, 32, (ctx) => {
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(0, 32);
      ctx.lineTo(16, 4);
      ctx.lineTo(32, 32);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, 32);
      ctx.lineTo(16, 10);
      ctx.lineTo(24, 32);
      ctx.fill();
    });

    // 4. Soul Collectible Orb
    this.makeCanvas(scene, 'soul_orb', 20, 20, (ctx) => {
      ctx.fillStyle = '#2ce8f5';
      ctx.shadowColor = '#2ce8f5';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(10, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. White Spark Particle (for hits, dust, magic bursts)
    this.makeCanvas(scene, 'particle_spark', 8, 8, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Blood Spark Particle
    this.makeCanvas(scene, 'particle_blood', 8, 8, (ctx) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Light Flare for Torches & Shrines
    this.makeCanvas(scene, 'light_flare', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
      grad.addColorStop(0, 'rgba(255, 180, 80, 0.45)');
      grad.addColorStop(0.4, 'rgba(240, 100, 30, 0.18)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    });

    // 8. Long-range Crescent Blade Wave (Third Combo Strike)
    this.makeCanvas(scene, 'slash_wave', 48, 64, (ctx) => {
      ctx.shadowColor = '#2ce8f5';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#2ce8f5';
      ctx.beginPath();
      ctx.arc(20, 32, 28, -Math.PI * 0.45, Math.PI * 0.45, false);
      ctx.arc(12, 32, 24, Math.PI * 0.45, -Math.PI * 0.45, true);
      ctx.closePath();
      ctx.fill();

      // Bright white core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(20, 32, 24, -Math.PI * 0.35, Math.PI * 0.35, false);
      ctx.arc(16, 32, 22, Math.PI * 0.35, -Math.PI * 0.35, true);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  // --- PHASE 2 TEXTURES (Metroidvania Obstacles, Sister Stasis, Ability VFX) ---
  static createPhase2Textures(scene) {
    // 1. Cracked Stone Wall (32x96 px)
    this.makeCanvas(scene, 'cracked_wall', 32, 96, (ctx) => {
      // Ancient dark granite slab
      ctx.fillStyle = '#1c192b';
      ctx.fillRect(0, 0, 32, 96);
      ctx.fillStyle = '#2d2745';
      ctx.fillRect(2, 2, 28, 92);

      // Stone brick lines
      ctx.strokeStyle = '#0f0c1b';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 28, 92);
      ctx.beginPath();
      ctx.moveTo(2, 32); ctx.lineTo(30, 32);
      ctx.moveTo(2, 64); ctx.lineTo(30, 64);
      ctx.stroke();

      // Deep glowing fracture fissures (weakness to Aegis Bash)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(6, 4);
      ctx.lineTo(16, 22);
      ctx.lineTo(12, 45);
      ctx.lineTo(24, 60);
      ctx.lineTo(14, 78);
      ctx.lineTo(22, 92);
      ctx.stroke();

      // Branching crack
      ctx.beginPath();
      ctx.moveTo(12, 45);
      ctx.lineTo(4, 52);
      ctx.moveTo(24, 60);
      ctx.lineTo(28, 70);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 2. Grapple Ring (28x28 px)
    this.makeCanvas(scene, 'grapple_ring', 28, 28, (ctx) => {
      // Golden Gargoyle bracket mount
      ctx.fillStyle = '#475569';
      ctx.fillRect(10, 0, 8, 8);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(12, 6, 4, 4);

      // Glowing golden ring
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(14, 17, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Bright inner flare
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14, 17, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 3. Arcane Crystal Pedestal - Dormant (28x48 px)
    this.makeCanvas(scene, 'arcane_crystal_dormant', 28, 48, (ctx) => {
      // Carved stone pedestal
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(4, 28, 20, 20);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(2, 44, 24, 4);

      // Dormant unlit dark crystal shard
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(14, 6);
      ctx.lineTo(22, 16);
      ctx.lineTo(14, 28);
      ctx.lineTo(6, 16);
      ctx.closePath();
      ctx.fill();

      // Dim purple core
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.moveTo(14, 10);
      ctx.lineTo(18, 16);
      ctx.lineTo(14, 24);
      ctx.lineTo(10, 16);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Arcane Crystal Pedestal - Active (28x48 px)
    this.makeCanvas(scene, 'arcane_crystal_active', 28, 48, (ctx) => {
      // Carved pedestal with energized runes
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(4, 28, 20, 20);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(2, 44, 24, 4);

      // Radiant active starlight crystal
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.lineTo(24, 16);
      ctx.lineTo(14, 28);
      ctx.lineTo(4, 16);
      ctx.closePath();
      ctx.fill();

      // White star core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(14, 8);
      ctx.lineTo(19, 16);
      ctx.lineTo(14, 24);
      ctx.lineTo(9, 16);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 5. Spectral Hard-Light Bridge (32x16 px)
    this.makeCanvas(scene, 'spectral_bridge', 32, 16, (ctx) => {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fillRect(0, 0, 32, 16);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 32, 16);

      // Arcane runes on bridge surface
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 6, 4, 4);
      ctx.fillRect(20, 6, 4, 4);
    });

    // 6. Imprisoned Sister Stasis Bubble (64x64 px)
    this.makeCanvas(scene, 'stasis_bubble', 64, 64, (ctx) => {
      const grad = ctx.createRadialGradient(32, 32, 8, 32, 32, 30);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
      grad.addColorStop(0.7, 'rgba(192, 132, 252, 0.45)');
      grad.addColorStop(1, 'rgba(147, 51, 234, 0.85)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.fill();

      // Outer runic orbital ring
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Runic nodes
      [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach((ang) => {
        const nx = 32 + Math.cos(ang) * 28;
        const ny = 32 + Math.sin(ang) * 28;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    });

    // 7. Percy's Aegis Shield Aura Projection (36x56 px)
    this.makeCanvas(scene, 'aegis_shield_aura', 36, 56, (ctx) => {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(36, 12);
      ctx.lineTo(32, 44);
      ctx.lineTo(18, 56);
      ctx.lineTo(4, 44);
      ctx.lineTo(0, 12);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lion crest symbol
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(18, 24, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 8. Mona's Astral Ray Segment (48x16 px)
    this.makeCanvas(scene, 'astral_ray_beam', 48, 16, (ctx) => {
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;

      // Outer violet glow
      ctx.fillStyle = '#9333ea';
      ctx.fillRect(0, 2, 48, 12);

      // Cyan mid-beam
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(0, 4, 48, 8);

      // Blinding white core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 6, 48, 4);
      ctx.shadowBlur = 0;
    });

    // 9. Tilly's Grapple Chain Link (8x8 px)
    this.makeCanvas(scene, 'grapple_chain_link', 8, 8, (ctx) => {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 8, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(2, 2, 4, 4);
    });

    // 10. The 4-Sister Sanctum Barrier Seal (32x160 px)
    this.makeCanvas(scene, 'barrier_seal', 32, 160, (ctx) => {
      // Barrier field
      ctx.fillStyle = 'rgba(15, 12, 28, 0.88)';
      ctx.fillRect(0, 0, 32, 160);

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 30, 158);

      // 4 Runes representing the 4 sisters
      const sisterColors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
      sisterColors.forEach((col, i) => {
        const cy = 24 + i * 38;
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(16, cy, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    });
  }

  // --- PHASE 3: BIOME TILES, BACKGROUNDS, AND REGIONAL ENEMIES ---
  static createPhase3Textures(scene) {
    // 1. Crystal Grotto Ground (32x32: deep obsidian rock with embedded luminescent gems)
    this.makeCanvas(scene, 'tile_crystal_ground', 32, 32, (ctx) => {
      const rockGrad = ctx.createLinearGradient(0, 0, 0, 32);
      rockGrad.addColorStop(0, '#191338');
      rockGrad.addColorStop(1, '#090717');
      ctx.fillStyle = rockGrad;
      ctx.fillRect(0, 0, 32, 32);

      // Deep crystalline block fissures
      ctx.fillStyle = '#060410';
      ctx.fillRect(0, 15, 32, 1.5);
      ctx.fillRect(16, 0, 1.5, 15);
      ctx.fillRect(10, 16, 1.5, 16);

      // Crystal facet bevels
      ctx.fillStyle = '#2e1c59';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(17, 0, 15, 2);

      // Glowing Cyan & Violet Crystal Clusters sprouting from stone
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(8, 9);
      ctx.lineTo(3, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#d8b4fe';
      ctx.beginPath();
      ctx.moveTo(22, 16);
      ctx.lineTo(26, 26);
      ctx.lineTo(19, 23);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bioluminescent top rim
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, 32, 1.5);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(8, 0, 16, 1);
    });

    // 2. Crystal Grotto Platform (32x32: floating prismatic crystal slab)
    this.makeCanvas(scene, 'tile_crystal_plat', 32, 32, (ctx) => {
      const platGrad = ctx.createLinearGradient(0, 0, 0, 32);
      platGrad.addColorStop(0, '#2e1065');
      platGrad.addColorStop(1, '#0f0524');
      ctx.fillStyle = platGrad;
      ctx.fillRect(0, 0, 32, 32);

      // Top glowing crystalline facet edge
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, 0, 32, 4);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(4, 1, 24, 1.5); // Sharp specular reflection line

      // Prismatic diamond cuts across slab
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(16, 26);
      ctx.lineTo(32, 4);
      ctx.stroke();

      // Hanging crystal stalactite below platform
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(13, 26);
      ctx.lineTo(19, 26);
      ctx.lineTo(16, 32);
      ctx.closePath();
      ctx.fill();
    });

    // 3. Molten Foundry Ground (32x32: heavy riveted iron plates with magma fissures)
    this.makeCanvas(scene, 'tile_foundry_ground', 32, 32, (ctx) => {
      // Dark scorched slag base
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, 32, 32);

      // Heavy industrial steel panel border
      ctx.fillStyle = '#292524';
      ctx.fillRect(2, 2, 28, 28);
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(2, 2, 28, 28);

      // Golden brass corner rivets with highlights
      const rivets = [[4, 4], [25, 4], [4, 25], [25, 25]];
      rivets.forEach(([rx, ry]) => {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(rx, ry, 3, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(rx, ry, 1, 1);
      });

      // Glowing molten magma fissure running through the iron
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(14, 12);
      ctx.lineTo(18, 20);
      ctx.lineTo(15, 32);
      ctx.stroke();

      // Blazing yellow-hot core
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(14, 12);
      ctx.lineTo(18, 20);
      ctx.lineTo(15, 30);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 4. Molten Foundry Platform / Iron Grate (32x32)
    this.makeCanvas(scene, 'tile_foundry_plat', 32, 32, (ctx) => {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, 32, 32);

      // Grate slits with radiant molten orange underglow
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4, 5, 4, 22);
      ctx.fillRect(12, 5, 4, 22);
      ctx.fillRect(20, 5, 4, 22);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(5, 7, 2, 18);
      ctx.fillRect(13, 7, 2, 18);
      ctx.fillRect(21, 7, 2, 18);

      // Heavy bronze border with beveled top edge
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 30, 30);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, 32, 2);
    });

    // 5. Bubbling Lava Hazard (32x32)
    this.makeCanvas(scene, 'hazard_lava', 32, 32, (ctx) => {
      // Magma depth gradient
      const lavaGrad = ctx.createLinearGradient(0, 0, 0, 32);
      lavaGrad.addColorStop(0, '#ea580c');
      lavaGrad.addColorStop(0.4, '#c2410c');
      lavaGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, 0, 32, 32);

      // Surface boiling wave crusts
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(6, 4, 5, 0, Math.PI);
      ctx.arc(17, 3, 6, 0, Math.PI);
      ctx.arc(27, 5, 5, 0, Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark floating cooling basalt crusts
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 14, 6, 3);
      ctx.fillRect(18, 20, 8, 4);
    });

    // 6. Howling Spire Ground (32x32: ancient weathered cathedral masonry)
    this.makeCanvas(scene, 'tile_spire_ground', 32, 32, (ctx) => {
      // Wind-buffeted ivory-slate stone
      const stoneGrad = ctx.createLinearGradient(0, 0, 0, 32);
      stoneGrad.addColorStop(0, '#334155');
      stoneGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = stoneGrad;
      ctx.fillRect(0, 0, 32, 32);

      // Masonry grout lines
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 15, 32, 1.5);
      ctx.fillRect(16, 0, 1.5, 15);
      ctx.fillRect(16, 16, 1.5, 16);

      // Pale ivory top highlights
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 16, 2);
      ctx.fillRect(17, 0, 15, 2);

      // Ancient carved wind rune glyphs
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(6, 6, 6, 1.5);
      ctx.fillRect(20, 22, 8, 1.5);
    });

    // 7. Howling Spire Platform (32x32: gothic cathedral cornice)
    this.makeCanvas(scene, 'tile_spire_plat', 32, 32, (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 32, 32);

      // Gothic arch under-carving
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(16, 32, 13, Math.PI, 0);
      ctx.fill();

      // Top edge with tempest wind glow
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(0, 0, 32, 3.5);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(4, 1, 24, 1.5);
    });

    // 8. Background: The Sunken Crystal Grotto (1200x800 High-Detail Cavern Panorama)
    this.makeCanvas(scene, 'bg_grotto', 1200, 800, (ctx) => {
      // Subterranean atmospheric depth gradient
      const cavernGrad = ctx.createLinearGradient(0, 0, 0, 800);
      cavernGrad.addColorStop(0, '#03030d');
      cavernGrad.addColorStop(0.3, '#080c25');
      cavernGrad.addColorStop(0.7, '#130d2d');
      cavernGrad.addColorStop(1, '#05030e');
      ctx.fillStyle = cavernGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Distant giant cavern rock arches and subterranean pillars (deep background silhouette)
      ctx.fillStyle = '#060717';
      // Arch 1
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.bezierCurveTo(180, 260, 360, 260, 520, 440);
      ctx.lineTo(520, 800);
      ctx.lineTo(0, 800);
      ctx.closePath();
      ctx.fill();

      // Arch 2 (center/right)
      ctx.beginPath();
      ctx.moveTo(560, 460);
      ctx.bezierCurveTo(740, 240, 960, 240, 1140, 470);
      ctx.lineTo(1200, 500);
      ctx.lineTo(1200, 800);
      ctx.lineTo(560, 800);
      ctx.closePath();
      ctx.fill();

      // Midground organic cavern pillars with branching crystal veins
      ctx.fillStyle = '#0a0d26';
      const pillars = [
        [90, 160, 65, 640],
        [320, 180, 80, 620],
        [690, 150, 75, 650],
        [940, 170, 70, 630],
        [1120, 190, 60, 610],
      ];
      pillars.forEach(([px, py, pw, ph]) => {
        // Natural jagged tapering column
        ctx.beginPath();
        ctx.moveTo(px + 10, py);
        ctx.lineTo(px + pw - 10, py);
        ctx.lineTo(px + pw + 15, py + ph);
        ctx.lineTo(px - 15, py + ph);
        ctx.closePath();
        ctx.fill();

        // Branching bioluminescent mineral veins
        ctx.strokeStyle = '#22d3ee';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.5, py + 80);
        ctx.lineTo(px + pw * 0.35, py + 160);
        ctx.lineTo(px + pw * 0.6, py + 260);
        ctx.lineTo(px + pw * 0.4, py + 380);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Volumetric Diagonal Starlight Beams (God Rays filtering through ceiling fractures)
      const rays = [
        [180, 0, 380, 800, 'rgba(34, 211, 238, 0.08)'],
        [460, 0, 720, 800, 'rgba(168, 85, 247, 0.07)'],
        [820, 0, 1060, 800, 'rgba(56, 189, 248, 0.08)'],
      ];
      rays.forEach(([rx1, ry1, rx2, ry2, col]) => {
        const rayGrad = ctx.createLinearGradient(rx1, ry1, rx2, ry2);
        rayGrad.addColorStop(0, col);
        rayGrad.addColorStop(0.6, col.replace('0.08', '0.03').replace('0.07', '0.02'));
        rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rx1, 0);
        ctx.lineTo(rx1 + 70, 0);
        ctx.lineTo(rx2 + 160, 800);
        ctx.lineTo(rx2, 800);
        ctx.closePath();
        ctx.fill();
      });

      // Ceiling Rock Strata & Hanging Crystal Clusters (Only at the true ceiling 0 to 180px)
      ctx.fillStyle = '#060714';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1200, 0);
      ctx.lineTo(1200, 110);
      for (let cx = 1200; cx >= 0; cx -= 100) {
        ctx.quadraticCurveTo(cx - 50, 120 + Math.sin(cx) * 35, cx - 100, 95 + Math.cos(cx) * 20);
      }
      ctx.closePath();
      ctx.fill();

      // Giant Faceted Crystal Geodes hanging from the ceiling
      const ceilingGems = [
        [75, 40, 28, 125, '#06b6d4', '#22d3ee'],
        [160, 30, 36, 165, '#8b5cf6', '#c084fc'],
        [280, 45, 26, 115, '#22d3ee', '#67e8f9'],
        [420, 35, 44, 185, '#a855f7', '#d8b4fe'],
        [590, 40, 32, 140, '#06b6d4', '#38bdf8'],
        [760, 30, 46, 195, '#c084fc', '#e9d5ff'],
        [910, 45, 28, 130, '#22d3ee', '#a5f3fc'],
        [1060, 35, 38, 175, '#8b5cf6', '#d8b4fe'],
      ];
      ceilingGems.forEach(([gx, gy, gw, gh, colDark, colLight]) => {
        // Dark facet half
        ctx.fillStyle = colDark;
        ctx.shadowColor = colLight;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + gw / 2, gy + gh);
        ctx.lineTo(gx + gw / 2, gy);
        ctx.closePath();
        ctx.fill();

        // Bright facet half
        ctx.fillStyle = colLight;
        ctx.beginPath();
        ctx.moveTo(gx + gw / 2, gy);
        ctx.lineTo(gx + gw / 2, gy + gh);
        ctx.lineTo(gx + gw, gy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Specular center light ridge
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx + gw / 2, gy);
        ctx.lineTo(gx + gw / 2, gy + gh);
        ctx.stroke();
      });

      // Bottom Cavern Floor Formations & Rising Stalagmites (Bottom 660 to 800px)
      ctx.fillStyle = '#060714';
      ctx.beginPath();
      ctx.moveTo(0, 800);
      ctx.lineTo(1200, 800);
      ctx.lineTo(1200, 710);
      for (let bx = 1200; bx >= 0; bx -= 120) {
        ctx.quadraticCurveTo(bx - 60, 680 + Math.sin(bx) * 30, bx - 120, 720);
      }
      ctx.closePath();
      ctx.fill();

      // Rising floor crystals
      const floorGems = [
        [120, 730, 24, 75, '#06b6d4'],
        [240, 715, 32, 95, '#a855f7'],
        [490, 725, 26, 80, '#22d3ee'],
        [830, 710, 36, 105, '#c084fc'],
        [1020, 720, 30, 85, '#38bdf8'],
      ];
      floorGems.forEach(([fx, fy, fw, fh, fcol]) => {
        ctx.fillStyle = fcol;
        ctx.shadowColor = fcol;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + fw / 2, fy - fh);
        ctx.lineTo(fx + fw, fy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Ethereal Bioluminescent Ground Fog
      const grottoFog = ctx.createLinearGradient(0, 660, 0, 800);
      grottoFog.addColorStop(0, 'rgba(6, 182, 212, 0)');
      grottoFog.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
      grottoFog.addColorStop(1, 'rgba(168, 85, 247, 0.18)');
      ctx.fillStyle = grottoFog;
      ctx.fillRect(0, 660, 1200, 140);
    });

    // 9. Background: The Molten Foundry (1200x800 High-Detail Industrial Abyss)
    this.makeCanvas(scene, 'bg_foundry', 1200, 800, (ctx) => {
      // Scorched volcanic umber to magma glow gradient
      const foundryGrad = ctx.createLinearGradient(0, 0, 0, 800);
      foundryGrad.addColorStop(0, '#090403');
      foundryGrad.addColorStop(0.4, '#1a0805');
      foundryGrad.addColorStop(0.75, '#3d0f05');
      foundryGrad.addColorStop(1, '#5e1605');
      ctx.fillStyle = foundryGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Towering basalt rock columns & industrial smelting halls
      ctx.fillStyle = '#100604';
      [120, 380, 680, 980].forEach((colX) => {
        ctx.fillRect(colX, 60, 95, 740);
        // Column diagonal steel braces
        ctx.strokeStyle = '#1e0c07';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(colX, 100);
        ctx.lineTo(colX + 95, 220);
        ctx.moveTo(colX, 220);
        ctx.lineTo(colX + 95, 340);
        ctx.moveTo(colX, 340);
        ctx.lineTo(colX + 95, 460);
        ctx.stroke();
      });

      // Hanging Titan Chains (Individual interlocking links)
      ctx.strokeStyle = '#382f2d';
      ctx.lineWidth = 4;
      [240, 520, 820, 1100].forEach((chainX) => {
        for (let cy = 0; cy < 520; cy += 22) {
          ctx.strokeRect(chainX - 5, cy, 10, 18);
        }
      });

      // Cascading Rivers of Molten Magma pouring down rock channels
      const lavaFalls = [
        [280, 120, 24, 680],
        [750, 80, 32, 720],
      ];
      lavaFalls.forEach(([lx, ly, lw, lh]) => {
        // Outer radiant orange glow
        ctx.fillStyle = '#ea580c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 35;
        ctx.fillRect(lx - 6, ly, lw + 12, lh);

        // Core liquid yellow magma
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx, ly, lw, lh);
        ctx.shadowBlur = 0;
      });

      // Industrial Smelting Crucibles & Boilers in silhouette
      ctx.fillStyle = '#170906';
      ctx.fillRect(180, 420, 140, 300);
      ctx.fillRect(480, 380, 170, 340);
      ctx.fillRect(800, 440, 150, 280);

      // Glowing furnace fireboxes & heat grates
      [
        [210, 520, 80, 45],
        [520, 480, 90, 50],
        [835, 530, 80, 45],
      ].forEach(([fx, fy, fw, fh]) => {
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 24;
        ctx.fillRect(fx, fy, fw, fh);
        ctx.shadowBlur = 0;

        // Iron grate bars
        ctx.fillStyle = '#170906';
        for (let gx = fx + 10; gx < fx + fw - 5; gx += 14) {
          ctx.fillRect(gx, fy, 4, fh);
        }
      });

      // Blazing Sea of Molten Magma at the bottom of the foundry
      const seaGrad = ctx.createLinearGradient(0, 680, 0, 800);
      seaGrad.addColorStop(0, 'rgba(234, 88, 12, 0)');
      seaGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.7)');
      seaGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 680, 1200, 120);

      // Searing Heat Haze across the abyss
      const hazeGrad = ctx.createLinearGradient(0, 500, 0, 750);
      hazeGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      hazeGrad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 500, 1200, 250);
    });

    // 10. Background: The Howling Spire (1200x800 High-Detail Moonlit Cathedral Heights)
    this.makeCanvas(scene, 'bg_spire', 1200, 800, (ctx) => {
      // Open night sky vertical gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 800);
      skyGrad.addColorStop(0, '#03050b');
      skyGrad.addColorStop(0.35, '#0a1426');
      skyGrad.addColorStop(0.75, '#12243b');
      skyGrad.addColorStop(1, '#1b324d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Giant Luminous Pale Ivory Full Moon
      const mx = 820;
      const my = 210;
      const mRadius = 65;

      const moonAura = ctx.createRadialGradient(mx, my, mRadius - 10, mx, my, mRadius + 50);
      moonAura.addColorStop(0, 'rgba(248, 250, 252, 0.95)');
      moonAura.addColorStop(0.4, 'rgba(56, 189, 248, 0.35)');
      moonAura.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = moonAura;
      ctx.beginPath();
      ctx.arc(mx, my, mRadius + 50, 0, Math.PI * 2);
      ctx.fill();

      // Sharp moon disc with subtle crater seas
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(mx, my, mRadius, 0, Math.PI * 2);
      ctx.fill();

      // Pale grey lunar mares
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(mx - 18, my - 12, 16, 0, Math.PI * 2);
      ctx.arc(mx + 15, my - 22, 12, 0, Math.PI * 2);
      ctx.arc(mx + 12, my + 18, 22, 0, Math.PI * 2);
      ctx.fill();

      // Billowing Silver-Lined Storm Cloud Bands across the moon
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.beginPath();
      ctx.ellipse(mx - 30, my + 15, 110, 22, -0.08, 0, Math.PI * 2);
      ctx.ellipse(mx + 80, my - 15, 130, 26, 0.06, 0, Math.PI * 2);
      ctx.ellipse(320, 160, 180, 32, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Dramatic diagonal moonlight beam cutting through storm clouds
      const moonBeam = ctx.createLinearGradient(mx, my, mx - 350, 800);
      moonBeam.addColorStop(0, 'rgba(248, 250, 252, 0.15)');
      moonBeam.addColorStop(0.6, 'rgba(56, 189, 248, 0.05)');
      moonBeam.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonBeam;
      ctx.beginPath();
      ctx.moveTo(mx - 40, my + 40);
      ctx.lineTo(mx + 40, my + 40);
      ctx.lineTo(mx - 180, 800);
      ctx.lineTo(mx - 480, 800);
      ctx.closePath();
      ctx.fill();

      // Distant Gothic Cathedral Needle Spires & Flying Buttresses
      ctx.fillStyle = '#060a14';
      const spires = [
        [50, 280, 50, 520],
        [180, 190, 65, 610],
        [310, 320, 45, 480],
        [460, 210, 80, 590],
        [620, 140, 95, 660],
        [780, 260, 60, 540],
        [980, 170, 75, 630],
        [1120, 290, 50, 510],
      ];
      spires.forEach(([sx, sy, sw, sh]) => {
        // Pointed needle finial
        ctx.beginPath();
        ctx.moveTo(sx + sw / 2, sy - 70);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + sw, sy);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(sx, sy, sw, sh);

        // Gargoyle corbel ledge
        ctx.fillRect(sx - 12, sy + 35, 14, 8);
        ctx.fillRect(sx + sw - 2, sy + 35, 14, 8);
      });

      // Luminous Cathedral Lancet Windows in Spires
      [
        [205, 320, 18, 50],
        [490, 340, 22, 60],
        [655, 270, 26, 75],
        [1005, 300, 22, 55],
      ].forEach(([wx, wy, ww, wh]) => {
        ctx.fillStyle = '#67e8f9';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
        ctx.rect(wx, wy + ww / 2, ww, wh - ww / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Atmospheric Wind Strata across the Spire altitudes
      const windGrad = ctx.createLinearGradient(0, 650, 0, 800);
      windGrad.addColorStop(0, 'rgba(18, 36, 59, 0)');
      windGrad.addColorStop(1, 'rgba(18, 36, 59, 0.7)');
      ctx.fillStyle = windGrad;
      ctx.fillRect(0, 650, 1200, 150);
    });

    // 11. Background: Sanctum of the Void (1200x800 High-Detail Cosmic Abyss)
    this.makeCanvas(scene, 'bg_sanctum', 1200, 800, (ctx) => {
      // Deep interstellar void gradient
      const voidGrad = ctx.createLinearGradient(0, 0, 0, 800);
      voidGrad.addColorStop(0, '#020106');
      voidGrad.addColorStop(0.4, '#0e021a');
      voidGrad.addColorStop(0.75, '#220436');
      voidGrad.addColorStop(1, '#080112');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Swirling Cosmic Nebula Gas Clouds
      const nebula1 = ctx.createRadialGradient(420, 360, 20, 420, 360, 340);
      nebula1.addColorStop(0, 'rgba(217, 70, 239, 0.25)');
      nebula1.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
      nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula1;
      ctx.beginPath();
      ctx.arc(420, 360, 340, 0, Math.PI * 2);
      ctx.fill();

      const nebula2 = ctx.createRadialGradient(820, 420, 30, 820, 420, 360);
      nebula2.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
      nebula2.addColorStop(0.6, 'rgba(99, 102, 241, 0.1)');
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula2;
      ctx.beginPath();
      ctx.arc(820, 420, 360, 0, Math.PI * 2);
      ctx.fill();

      // Colossal Dimensional Void Rift Vortex (Center)
      const rx = 600;
      const ry = 360;

      // Event horizon outer distortion rings
      ctx.strokeStyle = '#c084fc';
      ctx.shadowColor = '#d8b4fe';
      ctx.shadowBlur = 35;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(rx, ry, 95, 0, Math.PI * 1.85);
      ctx.stroke();

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(rx, ry, 60, 0.4, Math.PI * 2.1);
      ctx.stroke();

      // Pure Event Horizon Black Core
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(rx, ry, 45, 0, Math.PI * 2);
      ctx.fill();

      // Gravitational Lensing Streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      for (let s = 0; s < 12; s++) {
        const sa = (s * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(sa) * 110, ry + Math.sin(sa) * 110);
        ctx.lineTo(rx + Math.cos(sa + 0.3) * 190, ry + Math.sin(sa + 0.3) * 190);
        ctx.stroke();
      }

      // Shattered Floating Obsidian Megaliths & Obelisks
      ctx.fillStyle = '#07020d';
      const obelisks = [
        [140, 220, 45, 240, 0.12],
        [320, 460, 35, 180, -0.18],
        [890, 180, 50, 260, -0.09],
        [1060, 420, 40, 210, 0.15],
      ];
      obelisks.forEach(([ox, oy, ow, oh, orot]) => {
        ctx.save();
        ctx.translate(ox + ow / 2, oy + oh / 2);
        ctx.rotate(orot);
        ctx.fillRect(-ow / 2, -oh / 2, ow, oh);

        // Glowing runic glyph on obelisk
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.fillRect(-4, -20, 8, 40);
        ctx.fillRect(-12, -4, 24, 8);
        ctx.restore();
      });
      ctx.shadowBlur = 0;
    });

    // --- ENEMY SPRITES: ARCANE WISP (40x40) ---
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `wisp_idle_${f}`, 40, 40, (ctx) => {
        const pulse = f === 1 ? 2 : 0;

        // Outer starlight aura
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.beginPath();
        ctx.arc(20, 20, 16 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting cyan crystal shards
        const angle = f * Math.PI * 0.5;
        for (let i = 0; i < 3; i++) {
          const a = angle + (i * Math.PI * 2) / 3;
          const ox = 20 + Math.cos(a) * 12;
          const oy = 20 + Math.sin(a) * 12;

          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Radiant white/cyan core
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(20, 20, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(20, 20, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });

    // Wisp Spark Projectile (16x16)
    this.makeCanvas(scene, 'wisp_spark', 16, 16, (ctx) => {
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(8, 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, 8, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- ENEMY SPRITES: MAGMA SENTINEL (54x64) ---
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `sentinel_idle_${f}`, 54, 64, (ctx) => {
        const bob = f === 1 ? -1 : 0;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(27, 62, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heavy volcanic legs
        ctx.fillStyle = '#292524';
        ctx.fillRect(14, 44, 10, 18);
        ctx.fillRect(30, 44, 10, 18);

        // Heavy Torso (Obsidian Armor)
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(12, 20 + bob, 30, 26);

        // Glowing magma fissures across chest
        ctx.strokeStyle = '#ea580c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(16, 24 + bob);
        ctx.lineTo(24, 34 + bob);
        ctx.lineTo(38, 30 + bob);
        ctx.stroke();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(17, 24 + bob);
        ctx.lineTo(24, 34 + bob);
        ctx.lineTo(37, 30 + bob);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Massive spiked shoulders
        ctx.fillStyle = '#44403c';
        ctx.fillRect(6, 18 + bob, 10, 14);
        ctx.fillRect(38, 18 + bob, 10, 14);

        // Head / Molten Visor
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(20, 10 + bob, 14, 12);
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 6;
        ctx.fillRect(22, 14 + bob, 10, 3);
        ctx.shadowBlur = 0;
      });
    });

    // Magma Sentinel Slam (64x64)
    this.makeCanvas(scene, 'sentinel_slam', 64, 64, (ctx) => {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(18, 22, 28, 28);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(10, 16, 12, 14);
      ctx.fillRect(42, 16, 12, 14);

      // Fists slammed into ground with explosion
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 14;
      ctx.fillRect(20, 52, 24, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(24, 54, 16, 6);
      ctx.shadowBlur = 0;
    });

    // Magma Spit Projectile (20x20)
    this.makeCanvas(scene, 'magma_ball', 20, 20, (ctx) => {
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(10, 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(10, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- ENEMY SPRITES: STORM HARPY (48x48) ---
    [0, 1].forEach((f) => {
      this.makeCanvas(scene, `harpy_fly_${f}`, 48, 48, (ctx) => {
        const wingY = f === 1 ? -8 : 6;

        // Sleek shadowy avian body
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.ellipse(24, 26, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Indigo / violet Wings spread
        ctx.fillStyle = '#4338ca';
        ctx.beginPath();
        ctx.moveTo(24, 22);
        ctx.lineTo(4, 18 + wingY);
        ctx.lineTo(12, 34);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(24, 22);
        ctx.lineTo(44, 18 + wingY);
        ctx.lineTo(36, 34);
        ctx.closePath();
        ctx.fill();

        // Head with razor beak
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.arc(24, 14, 6, 0, Math.PI * 2);
        ctx.fill();

        // Razor beak
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(22, 14);
        ctx.lineTo(26, 14);
        ctx.lineTo(24, 20);
        ctx.fill();

        // Glowing cyan predatory eyes
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 4;
        ctx.fillRect(22, 12, 2, 2);
        ctx.fillRect(25, 12, 2, 2);
        ctx.shadowBlur = 0;

        // Sharp talons hanging
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(20, 38, 3, 6);
        ctx.fillRect(26, 38, 3, 6);
      });
    });

    // Storm Harpy Dive (48x48)
    this.makeCanvas(scene, 'harpy_dive', 48, 48, (ctx) => {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(24, 22, 8, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Folded wings dive-bombing
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(12, 12, 8, 20);
      ctx.fillRect(28, 12, 8, 20);

      // Talons thrust forward
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.fillRect(18, 38, 5, 8);
      ctx.fillRect(26, 38, 5, 8);
      ctx.shadowBlur = 0;
    });
  }

  // --- PHASE 4: CAMPFIRE HAVEN & ANCIENT SISTER KEEPSAKES ---
  static createPhase4Textures(scene) {
    // 1. Campfire Haven Warm Ambient Glow (128x128)
    this.makeCanvas(scene, 'campfire_haven_glow', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      grad.addColorStop(0.35, 'rgba(249, 115, 22, 0.25)');
      grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    });

    // 2. Wren's Zephyr Ribbon (28x28) — +25 Max Health
    this.makeCanvas(scene, 'keepsake_ribbon', 28, 28, (ctx) => {
      // Emerald glowing aura halo
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.beginPath();
      ctx.arc(14, 14, 12, 0, Math.PI * 2);
      ctx.fill();

      // Golden wind clasp
      ctx.fillStyle = '#fcd34d';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(14, 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Flowing emerald silk ribbon loops
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, 10);
      ctx.bezierCurveTo(8, 4, 4, 12, 12, 14);
      ctx.moveTo(14, 10);
      ctx.bezierCurveTo(20, 4, 24, 12, 16, 14);
      ctx.stroke();

      // Fluttering tails
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(12, 14);
      ctx.quadraticCurveTo(6, 20, 8, 26);
      ctx.moveTo(16, 14);
      ctx.quadraticCurveTo(22, 20, 20, 26);
      ctx.stroke();

      // Star sparkles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, 9, 2, 2);
      ctx.fillRect(7, 24, 2, 2);
      ctx.fillRect(19, 24, 2, 2);
    });

    // 3. Percy's Aegis Crest (28x28) — +25 Max Health
    this.makeCanvas(scene, 'keepsake_crest', 28, 28, (ctx) => {
      // Golden sun aura
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.beginPath();
      ctx.arc(14, 14, 12, 0, Math.PI * 2);
      ctx.fill();

      // Heavy golden shield base
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(6, 5);
      ctx.lineTo(22, 5);
      ctx.lineTo(22, 15);
      ctx.lineTo(14, 25);
      ctx.lineTo(6, 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark iron inner field
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(9, 8);
      ctx.lineTo(19, 8);
      ctx.lineTo(19, 14);
      ctx.lineTo(14, 21);
      ctx.lineTo(9, 14);
      ctx.closePath();
      ctx.fill();

      // Golden lion / eagle sigil
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(14, 13, 3, 0, Math.PI * 2);
      ctx.fill();

      // Sapphire gem at center
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 12, 2, 2);
    });

    // 4. Mona's Astral Stardial (28x28) — +25 Max Soul
    this.makeCanvas(scene, 'keepsake_stardial', 28, 28, (ctx) => {
      // Celestial violet nebula aura
      ctx.fillStyle = 'rgba(139, 92, 246, 0.32)';
      ctx.beginPath();
      ctx.arc(14, 14, 13, 0, Math.PI * 2);
      ctx.fill();

      // Outer bronze celestial astrolabe ring
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(14, 14, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner crescent moon
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(14, 14, 7, -Math.PI / 2, Math.PI / 2, false);
      ctx.arc(16, 14, 5.5, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      ctx.fill();

      // Center glowing celestial star
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(12, 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Starlight markers
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(13, 3, 2, 3);
      ctx.fillRect(13, 22, 2, 3);
      ctx.fillRect(3, 13, 3, 2);
      ctx.fillRect(22, 13, 3, 2);
    });

    // 5. Tilly's Ember Charm (28x28) — +25 Max Soul
    this.makeCanvas(scene, 'keepsake_charm', 28, 28, (ctx) => {
      // Crimson campfire spark aura
      ctx.fillStyle = 'rgba(239, 68, 68, 0.32)';
      ctx.beginPath();
      ctx.arc(14, 14, 12, 0, Math.PI * 2);
      ctx.fill();

      // Braided crimson hanging cord
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 2);
      ctx.lineTo(14, 8);
      ctx.stroke();

      // Scout lantern bell / pendant
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(14, 13, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Glowing ember lantern core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(14, 13, 3, 0, Math.PI * 2);
      ctx.fill();

      // Golden tassel tails hanging below
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(12, 19, 4, 7);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(13, 23, 2, 3);
    });
  }

  // --- PHASE 5: MALAKOR UNBOUND & CLIMAX BOSS TEXTURES ---
  static createPhase5Textures(scene) {
    // 1. Astral Void Barrier Aegis (100x100)
    this.makeCanvas(scene, 'boss_astral_barrier', 100, 100, (ctx) => {
      // Cosmic pulsing outer aura
      const grad = ctx.createRadialGradient(50, 50, 20, 50, 50, 48);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
      grad.addColorStop(0.6, 'rgba(34, 211, 238, 0.45)');
      grad.addColorStop(0.85, 'rgba(192, 132, 252, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 100, 100);

      // Crystalline hexagonal energy shield
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Ancient celestial runes on boundary
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    // 2. Void Meteor Projectile (28x28)
    this.makeCanvas(scene, 'void_meteor', 28, 28, (ctx) => {
      // Dark purple cosmic aura
      ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
      ctx.beginPath();
      ctx.arc(14, 14, 13, 0, Math.PI * 2);
      ctx.fill();

      // Burning dark core
      ctx.fillStyle = '#581c87';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(14, 14, 8, 0, Math.PI * 2);
      ctx.fill();

      // Fiery magenta rim
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(14, 14, 4, 0, Math.PI * 2);
      ctx.fill();

      // Hot white star center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14, 14, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 3. Malakor Levitating Astral Form (96x96)
    this.makeCanvas(scene, 'boss_levitate', 96, 96, (ctx) => {
      // Outstretched shadowy wings of void energy
      ctx.fillStyle = 'rgba(88, 28, 135, 0.7)';
      ctx.beginPath();
      ctx.moveTo(48, 40);
      ctx.bezierCurveTo(20, 10, 5, 25, 8, 60);
      ctx.lineTo(40, 50);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(48, 40);
      ctx.bezierCurveTo(76, 10, 91, 25, 88, 60);
      ctx.lineTo(56, 50);
      ctx.closePath();
      ctx.fill();

      // Cloak & Plate Body
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(38, 30);
      ctx.lineTo(58, 30);
      ctx.lineTo(64, 75);
      ctx.lineTo(32, 75);
      ctx.closePath();
      ctx.fill();

      // Spiked Pauldrons
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(30, 32, 10, 12);
      ctx.fillRect(56, 32, 10, 12);

      // Horned Dark Greathelm
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(48, 24, 11, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(40, 18);
      ctx.lineTo(32, 4);
      ctx.lineTo(44, 16);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(56, 18);
      ctx.lineTo(64, 4);
      ctx.lineTo(52, 16);
      ctx.fill();

      // Glowing crimson/magenta eyes
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillRect(43, 23, 3, 2);
      ctx.fillRect(50, 23, 3, 2);
      ctx.shadowBlur = 0;

      // Dark greatsword held vertically
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(46, 36, 4, 48);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(47, 40, 2, 40);
    });

    // 4. Malakor Stunned / Reeling Form (96x96)
    this.makeCanvas(scene, 'boss_stunned', 96, 96, (ctx) => {
      // Reeling backward body
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(34, 38);
      ctx.lineTo(54, 34);
      ctx.lineTo(62, 78);
      ctx.lineTo(30, 80);
      ctx.closePath();
      ctx.fill();

      // Head tilted back
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(44, 26, 11, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(36, 20);
      ctx.lineTo(26, 8);
      ctx.lineTo(40, 18);
      ctx.fill();

      // Dazed stars circling head
      const starColors = ['#fbbf24', '#f59e0b', '#fef08a'];
      [
        { x: 28, y: 14 },
        { x: 44, y: 8 },
        { x: 60, y: 16 }
      ].forEach((s, idx) => {
        ctx.fillStyle = starColors[idx];
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });
  }

  // =========================================================================
  // PHASE 8: EXPANSIVE WORLD, REGIONAL BIOME BOSSES & LEYLINES
  // =========================================================================
  static createPhase8Textures(scene) {
    // -----------------------------------------------------------------------
    // 1. BOSS OSSIAN, THE CRYPT WARDEN (Catacombs Boss: 72x88)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'boss_ossian_idle', 72, 88, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(36, 84, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Weathered steel plate legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(24, 60, 10, 24);
      ctx.fillRect(38, 60, 10, 24);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(22, 78, 14, 6);
      ctx.fillRect(36, 78, 14, 6);

      // Tattered crypt shroud / tabard
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(22, 40);
      ctx.lineTo(50, 40);
      ctx.lineTo(54, 74);
      ctx.lineTo(18, 74);
      ctx.closePath();
      ctx.fill();

      // Steel Cuirass with ribbing
      ctx.fillStyle = '#475569';
      ctx.fillRect(24, 34, 24, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(28, 38, 16, 3);
      ctx.fillRect(28, 44, 16, 3);
      ctx.fillRect(30, 50, 12, 3);

      // Great Spiked Pauldrons
      ctx.fillStyle = '#64748b';
      ctx.fillRect(14, 30, 14, 12);
      ctx.fillRect(44, 30, 14, 12);

      // Armored Skull Helm
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(36, 22, 12, 0, Math.PI * 2);
      ctx.fill();

      // Spectral cyan eyes in skull sockets
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(32, 20, 3, 3);
      ctx.fillRect(39, 20, 3, 3);
      ctx.shadowBlur = 0;

      // Horned crest on helm
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(30, 12);
      ctx.lineTo(24, 2);
      ctx.lineTo(34, 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(42, 12);
      ctx.lineTo(48, 2);
      ctx.lineTo(38, 10);
      ctx.fill();

      // Massive Tower Shield (Left hand / foreground: x: 6, y: 26, w: 20, h: 56)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 26, 20, 56);
      ctx.fillStyle = '#94a3b8';
      ctx.strokeRect(6, 26, 20, 56);
      // Silver cross emblem on shield
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(14, 34, 4, 38);
      ctx.fillRect(9, 46, 14, 4);

      // Heavy Warhammer (Right hand: x: 54, y: 28)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(56, 30, 4, 42); // Haft
      ctx.fillStyle = '#475569';
      ctx.fillRect(50, 22, 16, 12); // Hammerhead
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(52, 24, 12, 8);
    });

    this.makeCanvas(scene, 'boss_ossian_attack', 84, 88, (ctx) => {
      // Warhammer raised overhead preparing for ground-shattering slam!
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(36, 84, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs braced
      ctx.fillStyle = '#334155';
      ctx.fillRect(20, 60, 12, 24);
      ctx.fillRect(40, 60, 12, 24);

      // Body leaning forward
      ctx.fillStyle = '#475569';
      ctx.fillRect(24, 34, 26, 26);

      // Head
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(38, 22, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillRect(36, 20, 4, 3);
      ctx.shadowBlur = 0;

      // Shield held forward defensively
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 32, 20, 50);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(4, 32, 20, 50);

      // Raised Warhammer overhead with crackling blue lightning
      ctx.fillStyle = '#78350f';
      ctx.fillRect(52, 6, 6, 40);
      ctx.fillStyle = '#475569';
      ctx.fillRect(44, 0, 22, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillRect(46, 2, 18, 10);
      ctx.shadowBlur = 0;
    });

    // -----------------------------------------------------------------------
    // 2. BOSS CAELITH, THE PRISMATIC WEAVER (Grotto Boss: 64x76)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'boss_caelith_idle', 64, 76, (ctx) => {
      // Shimmering celestial aura halo
      const grad = ctx.createRadialGradient(32, 36, 6, 32, 36, 30);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
      grad.addColorStop(0.7, 'rgba(34, 211, 238, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 36, 30, 0, Math.PI * 2);
      ctx.fill();

      // Flowing prismatic starlight robes
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(26, 30);
      ctx.lineTo(38, 30);
      ctx.lineTo(46, 70);
      ctx.lineTo(18, 70);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(28, 32);
      ctx.lineTo(36, 32);
      ctx.lineTo(42, 68);
      ctx.lineTo(22, 68);
      ctx.closePath();
      ctx.fill();

      // Bodice with crystal core
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(27, 24, 10, 12);
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 8;
      ctx.fillRect(30, 27, 4, 6);
      ctx.shadowBlur = 0;

      // Head & Crystalline Tiara
      ctx.fillStyle = '#fce7f3';
      ctx.beginPath();
      ctx.arc(32, 16, 7, 0, Math.PI * 2);
      ctx.fill();

      // Glowing cyan eyes
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(30, 16, 2, 2);
      ctx.fillRect(34, 16, 2, 2);

      // Prismatic crown / horns
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(26, 12);
      ctx.lineTo(38, 12);
      ctx.closePath();
      ctx.fill();

      // Orbiting Refractive Prisms (Left and Right)
      [
        { x: 10, y: 28, color: '#22d3ee' },
        { x: 54, y: 28, color: '#f43f5e' },
      ].forEach((prism) => {
        ctx.fillStyle = prism.color;
        ctx.shadowColor = prism.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(prism.x, prism.y - 7);
        ctx.lineTo(prism.x + 5, prism.y);
        ctx.lineTo(prism.x, prism.y + 7);
        ctx.lineTo(prism.x - 5, prism.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });

    this.makeCanvas(scene, 'boss_caelith_cast', 64, 76, (ctx) => {
      // Radiant burst pose with outstretched arms
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(26, 30);
      ctx.lineTo(38, 30);
      ctx.lineTo(48, 72);
      ctx.lineTo(16, 72);
      ctx.closePath();
      ctx.fill();

      // Outstretched Arms
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(10, 26, 16, 4);
      ctx.fillRect(38, 26, 16, 4);

      // Star Flares at Hands
      [8, 56].forEach((hx) => {
        ctx.fillStyle = '#67e8f9';
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(hx, 28, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Head
      ctx.fillStyle = '#fce7f3';
      ctx.beginPath();
      ctx.arc(32, 16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(30, 16, 2, 2);
      ctx.fillRect(34, 16, 2, 2);
    });

    // -----------------------------------------------------------------------
    // 3. BOSS IGNIS, THE OBSIDIAN COLOSSUS (Foundry Boss: 84x96)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'boss_ignis_idle', 84, 96, (ctx) => {
      // Ground heat distortion & shadow
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.ellipse(42, 92, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Massive obsidian stone legs
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(22, 62, 16, 30);
      ctx.fillRect(46, 62, 16, 30);
      // Magma fissures on legs
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(26, 66, 3, 20);
      ctx.fillRect(52, 70, 3, 16);

      // Torso: Heavy brass-banded volcanic rock
      ctx.fillStyle = '#292524';
      ctx.fillRect(18, 30, 48, 34);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(18, 44, 48, 6); // Brass girdle

      // Glowing heart furnace in chest
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fillRect(36, 36, 12, 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(39, 39, 6, 6);
      ctx.shadowBlur = 0;

      // Titan Shoulders & Arms
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(6, 28, 14, 40);
      ctx.fillRect(64, 28, 14, 40);
      // Fists
      ctx.fillStyle = '#44403c';
      ctx.fillRect(4, 64, 16, 14);
      ctx.fillRect(64, 64, 16, 14);

      // Colossus Head: Iron Forge Visor
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(32, 14, 20, 16);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(30, 12, 24, 4);

      // Glowing magma visor slit
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.fillRect(34, 20, 16, 4);
      ctx.shadowBlur = 0;
    });

    this.makeCanvas(scene, 'boss_ignis_slam', 88, 96, (ctx) => {
      // Fists raised high with glowing lava trails
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.ellipse(44, 92, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(22, 62, 16, 30);
      ctx.fillRect(50, 62, 16, 30);

      // Torso
      ctx.fillStyle = '#292524';
      ctx.fillRect(20, 32, 48, 34);

      // Glowing chest furnace
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 16;
      ctx.fillRect(38, 38, 12, 12);
      ctx.shadowBlur = 0;

      // Raised Arms & Molten Anvil Fists
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(10, 4, 16, 34);
      ctx.fillRect(62, 4, 16, 34);
      ctx.fillStyle = '#ea580c';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.fillRect(8, 0, 20, 16);
      ctx.fillRect(60, 0, 20, 16);
      ctx.shadowBlur = 0;

      // Head
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(34, 18, 20, 16);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(36, 24, 16, 4);
    });

    // -----------------------------------------------------------------------
    // 4. BOSS ZEPHYRA, QUEEN OF THE TEMPEST (Spire Boss: 76x76)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'boss_zephyra_idle', 76, 76, (ctx) => {
      // Outstretched feathered storm wings
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(38, 38);
      ctx.lineTo(8, 14);
      ctx.lineTo(2, 44);
      ctx.lineTo(34, 50);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(38, 38);
      ctx.lineTo(68, 14);
      ctx.lineTo(74, 44);
      ctx.lineTo(42, 50);
      ctx.closePath();
      ctx.fill();

      // Wing feathers
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(12, 22);
      ctx.lineTo(4, 40);
      ctx.lineTo(24, 38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(64, 22);
      ctx.lineTo(72, 40);
      ctx.lineTo(52, 38);
      ctx.closePath();
      ctx.fill();

      // Harpy Torso & Feathers
      ctx.fillStyle = '#312e81';
      ctx.fillRect(32, 26, 12, 24);

      // Golden bladed talons
      ctx.fillStyle = '#facc15';
      ctx.fillRect(28, 50, 4, 14);
      ctx.fillRect(34, 50, 4, 14);
      ctx.fillRect(40, 50, 4, 14);
      ctx.fillRect(46, 50, 4, 14);

      // Head & Wind Crown
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(38, 18, 7, 0, Math.PI * 2);
      ctx.fill();

      // Glowing violet eyes
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 6;
      ctx.fillRect(36, 17, 2, 2);
      ctx.fillRect(40, 17, 2, 2);
      ctx.shadowBlur = 0;

      // Crown of storm feathers
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(38, 6);
      ctx.lineTo(32, 14);
      ctx.lineTo(44, 14);
      ctx.closePath();
      ctx.fill();
    });

    this.makeCanvas(scene, 'boss_zephyra_dive', 76, 76, (ctx) => {
      // Streamlined dive pose pointing downwards with wind shear lines
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(38, 68); // Beak / Talons pointed down
      ctx.lineTo(16, 10);
      ctx.lineTo(60, 10);
      ctx.closePath();
      ctx.fill();

      // Wings folded tight
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(38, 60);
      ctx.lineTo(24, 16);
      ctx.lineTo(52, 16);
      ctx.closePath();
      ctx.fill();

      // Talons thrust forward
      ctx.fillStyle = '#facc15';
      ctx.fillRect(34, 64, 4, 10);
      ctx.fillRect(40, 64, 4, 10);
    });

    // -----------------------------------------------------------------------
    // 5. ASTRAL LEYLINE STONES & WAYPOINTS (48x64)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'leyline_stone', 48, 64, (ctx) => {
      // Ground base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 52, 32, 12);
      ctx.fillStyle = '#334155';
      ctx.strokeRect(8, 52, 32, 12);

      // Ancient Runic Obelisk
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(14, 52);
      ctx.lineTo(18, 12);
      ctx.lineTo(24, 4);
      ctx.lineTo(30, 12);
      ctx.lineTo(34, 52);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      // Carved Runic Glyphs (dormant state: soft cyan)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(23, 18, 2, 6);
      ctx.fillRect(21, 28, 6, 2);
      ctx.fillRect(23, 34, 2, 8);
      ctx.fillRect(20, 46, 8, 2);

      // Hovering Astral Crystal Core
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(24, 16);
      ctx.lineTo(28, 22);
      ctx.lineTo(24, 28);
      ctx.lineTo(20, 22);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // -----------------------------------------------------------------------
    // 6. SHORTCUT PORTCULLIS & LEVER (32x96 and 24x24)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'shortcut_portcullis', 32, 96, (ctx) => {
      // Vertical iron bars
      ctx.fillStyle = '#334155';
      for (let x = 4; x < 32; x += 7) {
        ctx.fillRect(x, 0, 3, 90);
        // Spiked bottom tooth
        ctx.beginPath();
        ctx.moveTo(x - 1, 90);
        ctx.lineTo(x + 1.5, 96);
        ctx.lineTo(x + 4, 90);
        ctx.closePath();
        ctx.fill();
      }
      // Horizontal crossbars
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 16, 32, 6);
      ctx.fillRect(0, 48, 32, 6);
      ctx.fillRect(0, 80, 32, 6);
      // Iron rivets
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(6, 18, 2, 2);
      ctx.fillRect(24, 18, 2, 2);
      ctx.fillRect(6, 50, 2, 2);
      ctx.fillRect(24, 50, 2, 2);
    });

    this.makeCanvas(scene, 'lever_switch_0', 24, 24, (ctx) => {
      // Base plate
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 16, 16, 6);
      // Upright brass lever
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(11, 4, 3, 14);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(12.5, 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    this.makeCanvas(scene, 'lever_switch_1', 24, 24, (ctx) => {
      // Base plate
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 16, 16, 6);
      // Tilted lever (pulled)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(11, 16);
      ctx.lineTo(20, 8);
      ctx.lineTo(22, 10);
      ctx.lineTo(13, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(21, 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // -----------------------------------------------------------------------
    // 7. LIBRARY BOOKSHELF & OBSIDIAN PLATFORMS (32x32)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'tile_library_stack', 32, 32, (ctx) => {
      // Polished mahogany wood frame
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(2, 2, 28, 28);

      // Book spines in various colors (gold, sapphire, ruby, emerald)
      const colors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0284c7'];
      let bx = 4;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(bx, 5, 4, 22);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(bx + 1, 9, 2, 3); // Gold foil lettering
        bx += 5;
      }
    });
  }

  // =========================================================================
  // PHASE 6.5: 4 PRIMORDIAL SIGILS, RELIC KEYS & BASTION GATE TEXTURES
  // =========================================================================
  static createPhase6_5Textures(scene) {
    // -----------------------------------------------------------------------
    // 1. THE 4 PRIMORDIAL SIGILS (32x32)
    // -----------------------------------------------------------------------
    // Sigil of the Crypt (Ossian's Reward)
    this.makeCanvas(scene, 'sigil_crypt', 32, 32, (ctx) => {
      // Outer ethereal glow ring
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Crypt silver skull crest
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(16, 13, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(13, 17, 6, 5);

      // Cyan eye sockets
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 12, 2, 2);
      ctx.fillRect(17, 12, 2, 2);

      // Spectral cyan aura flames
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(19, 7);
      ctx.lineTo(13, 7);
      ctx.closePath();
      ctx.fill();
    });

    // Sigil of the Prism (Caelith's Reward)
    this.makeCanvas(scene, 'sigil_prism', 32, 32, (ctx) => {
      ctx.fillStyle = '#1e1035';
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#c084fc';
      ctx.stroke();

      // Prismatic Octahedron Gem
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(16, 5);
      ctx.lineTo(25, 16);
      ctx.lineTo(16, 21);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(16, 5);
      ctx.lineTo(7, 16);
      ctx.lineTo(16, 21);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(16, 27);
      ctx.lineTo(25, 16);
      ctx.lineTo(16, 21);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.moveTo(16, 27);
      ctx.lineTo(7, 16);
      ctx.lineTo(16, 21);
      ctx.closePath();
      ctx.fill();

      // White starlight core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 15, 2, 2);
    });

    // Sigil of the Forge (Ignis's Reward)
    this.makeCanvas(scene, 'sigil_forge', 32, 32, (ctx) => {
      ctx.fillStyle = '#2a0e05';
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f97316';
      ctx.stroke();

      // Molten Obsidian Anvil
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, 16, 12, 8);
      ctx.fillRect(8, 14, 16, 3);
      ctx.fillRect(6, 14, 3, 2);

      // Blazing Magma Core
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(16, 11, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(16, 11, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sigil of the Gale (Zephyra's Reward)
    this.makeCanvas(scene, 'sigil_gale', 32, 32, (ctx) => {
      ctx.fillStyle = '#062024';
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981';
      ctx.stroke();

      // Zephyr Wind Wings
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(16, 22);
      ctx.quadraticCurveTo(8, 18, 6, 8);
      ctx.quadraticCurveTo(12, 10, 16, 16);
      ctx.fill();

      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.moveTo(16, 22);
      ctx.quadraticCurveTo(24, 18, 26, 8);
      ctx.quadraticCurveTo(20, 10, 16, 16);
      ctx.fill();

      // Electric spark star in center
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, 11, 2, 5);
      ctx.fillRect(13, 13, 6, 2);
    });

    // -----------------------------------------------------------------------
    // 2. THE 4 ANCIENT RELIC KEYS (24x24)
    // -----------------------------------------------------------------------
    // Ossuary Key (Whispering Catacombs)
    this.makeCanvas(scene, 'key_ossuary', 24, 24, (ctx) => {
      ctx.fillStyle = '#e2e8f0';
      // Bone shaft
      ctx.fillRect(11, 8, 3, 12);
      // Teeth
      ctx.fillRect(14, 16, 4, 2);
      ctx.fillRect(14, 19, 3, 2);
      // Skull bow
      ctx.beginPath();
      ctx.arc(12.5, 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(11, 5, 1.5, 1.5);
      ctx.fillRect(13, 5, 1.5, 1.5);
    });

    // Prism Core Key (Sunken Crystal Grotto)
    this.makeCanvas(scene, 'key_prism', 24, 24, (ctx) => {
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(11, 9, 3, 11);
      ctx.fillRect(14, 16, 4, 2);
      ctx.fillRect(14, 18, 3, 2);
      // Diamond crystal head
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(12.5, 2);
      ctx.lineTo(17, 7);
      ctx.lineTo(12.5, 10);
      ctx.lineTo(8, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, 6, 1.5, 1.5);
    });

    // Smelter Valve Wheel Key (Molten Foundry)
    this.makeCanvas(scene, 'key_smelter', 24, 24, (ctx) => {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(11, 10, 3, 10);
      ctx.fillRect(14, 16, 4, 3);
      // Cogwheel bow
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(12.5, 6, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(11.5, 5, 2, 2);
    });

    // Grand Archives Seal Key (Howling Spire)
    this.makeCanvas(scene, 'key_archives', 24, 24, (ctx) => {
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(11, 9, 3, 11);
      ctx.fillRect(14, 15, 4, 2);
      ctx.fillRect(14, 18, 4, 2);
      // Star Astrolabe bow
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(12.5, 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(12.5, 6, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // -----------------------------------------------------------------------
    // 3. GREAT VOID BASTION GATE & SIGIL SOCKETS (48x160)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'bastion_gate', 48, 160, (ctx) => {
      // Obsidian colossal portal arch
      ctx.fillStyle = '#090714';
      ctx.fillRect(0, 0, 48, 160);

      // Flanking adamantine carved pillars
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, 8, 160);
      ctx.fillRect(40, 0, 8, 160);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(6, 0, 2, 160);
      ctx.fillRect(40, 0, 2, 160);

      // Central void gate iron lattices
      ctx.fillStyle = '#17142b';
      ctx.fillRect(8, 0, 32, 160);

      // 4 Carved Recessed Sigil Sockets (Crypt at y:24, Prism at y:58, Forge at y:92, Gale at y:126)
      const socketYs = [24, 58, 92, 126];
      socketYs.forEach((sy) => {
        // Socket outer ring
        ctx.fillStyle = '#0f0e21';
        ctx.beginPath();
        ctx.arc(24, sy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#4338ca';
        ctx.stroke();

        // Dormant runes
        ctx.fillStyle = '#312e81';
        ctx.fillRect(21, sy - 3, 6, 6);
      });
    });

    // Bastion Gate Sockets Lit Textures (20x20)
    this.makeCanvas(scene, 'bastion_socket_crypt', 20, 20, (ctx) => {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(10, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 9, 2, 2);
    });

    this.makeCanvas(scene, 'bastion_socket_prism', 20, 20, (ctx) => {
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(10, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 9, 2, 2);
    });

    this.makeCanvas(scene, 'bastion_socket_forge', 20, 20, (ctx) => {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(10, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 9, 2, 2);
    });

    this.makeCanvas(scene, 'bastion_socket_gale', 20, 20, (ctx) => {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(10, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 9, 2, 2);
    });

    // -----------------------------------------------------------------------
    // 4. RELIC KEY PORTCULLIS (32x96)
    // -----------------------------------------------------------------------
    this.makeCanvas(scene, 'relic_portcullis', 32, 96, (ctx) => {
      // Dark steel vertical bars
      ctx.fillStyle = '#1e293b';
      for (let x = 3; x < 32; x += 7) {
        ctx.fillRect(x, 0, 4, 92);
        // Spikes at bottom
        ctx.beginPath();
        ctx.moveTo(x - 1, 92);
        ctx.lineTo(x + 2, 96);
        ctx.lineTo(x + 5, 92);
        ctx.closePath();
        ctx.fill();
      }
      // Horizontal reinforced iron braces
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 14, 32, 8);
      ctx.fillRect(0, 74, 32, 8);

      // Central Antique Keyhole Padlock
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(10, 42, 12, 14);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(16, 42, 4, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(15, 47, 2, 5);
    });

    // -----------------------------------------------------------------------
    // 5. CROSS-BIOME ABILITY MECHANICS & HAZARDS
    // -----------------------------------------------------------------------
    // Thermal Conduit Switch (Off: dormant blue; On: blazing orange)
    this.makeCanvas(scene, 'thermal_conduit_off', 32, 32, (ctx) => {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 4, 24, 24);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 24, 24);
      // Dormant power crystal in center
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(16, 16, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    this.makeCanvas(scene, 'thermal_conduit_on', 32, 32, (ctx) => {
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(4, 4, 24, 24);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 24, 24);
      // Blazing ignited crystal
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(16, 16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(16, 16, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Iron Counterweight (Smashable with Percy's Shield Bash)
    this.makeCanvas(scene, 'iron_counterweight', 36, 40, (ctx) => {
      // Chain attachment
      ctx.fillStyle = '#64748b';
      ctx.fillRect(16, 0, 4, 8);
      // Heavy cast iron weight
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 8, 28, 30);
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 10, 24, 6);
      // Crack fissures telegraphed on surface
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, 16);
      ctx.lineTo(18, 24);
      ctx.lineTo(24, 20);
      ctx.lineTo(22, 34);
      ctx.stroke();
    });

    // Crumbling Platform (32x20)
    this.makeCanvas(scene, 'tile_crumbling', 32, 20, (ctx) => {
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 32, 20);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 32, 4);
      // Fracture lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(12, 8);
      ctx.lineTo(6, 16);
      ctx.moveTo(22, 2);
      ctx.lineTo(18, 11);
      ctx.lineTo(24, 18);
      ctx.stroke();
    });
  }

  // =========================================================================
  // PHASE 7: HACK-AND-SLASH COMBAT EVOLUTION & SISTER ASSISTS
  // =========================================================================
  static createPhase7Textures(scene) {
    // 1. Parry Shield Spark (32x32 Golden Flash Starburst)
    this.makeCanvas(scene, 'parry_shield_spark', 32, 32, (ctx) => {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.fill();

      // Radiant 8-pointed star
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(16, 0); ctx.lineTo(19, 13); ctx.lineTo(32, 16); ctx.lineTo(19, 19);
      ctx.lineTo(16, 32); ctx.lineTo(13, 19); ctx.lineTo(0, 16); ctx.lineTo(13, 13);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 16, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Downward Dive Shockwave (48x24 Seismic Ripple)
    this.makeCanvas(scene, 'dive_shockwave', 48, 24, (ctx) => {
      // Expanding ground dust & shockwave arc
      ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.beginPath();
      ctx.ellipse(24, 20, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upward stone jagged shards
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(8, 20); ctx.lineTo(12, 6); ctx.lineTo(16, 20);
      ctx.moveTo(20, 20); ctx.lineTo(24, 2); ctx.lineTo(28, 20);
      ctx.moveTo(32, 20); ctx.lineTo(36, 6); ctx.lineTo(40, 20);
      ctx.fill();
    });

    // 3. Execution Beacon (24x24 Glowing Skull Indicator)
    this.makeCanvas(scene, 'execute_beacon', 24, 24, (ctx) => {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Stylized white skull
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(10, 13, 4, 3);

      // Dark eye holes
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(10, 9, 1.5, 2);
      ctx.fillRect(12.5, 9, 1.5, 2);
    });

    // 4. Zephyr Cyclone Blade Particle (48x48 Gale Vortex)
    this.makeCanvas(scene, 'cyclone_blade', 48, 48, (ctx) => {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(24, 24, 18, 0, Math.PI * 1.5);
      ctx.stroke();

      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(24, 24, 12, Math.PI * 0.5, Math.PI * 2);
      ctx.stroke();
    });

    // 5. Starlight Prism Crystal (36x36 Ethereal Star Crystal)
    this.makeCanvas(scene, 'starlight_prism_crystal', 36, 36, (ctx) => {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(18, 2); ctx.lineTo(34, 18); ctx.lineTo(18, 34); ctx.lineTo(2, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(18, 6); ctx.lineTo(30, 18); ctx.lineTo(18, 30); ctx.lineTo(6, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(18, 18, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}


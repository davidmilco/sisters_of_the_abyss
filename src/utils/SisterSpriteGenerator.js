// Sister Sprite Generator: Procedurally renders distinct pixel/vector sprites,
// animations, and character portraits for Wren, Percy, Mona, and Tilly.

export const SISTERS_DATA = {
  wren: {
    id: 'wren',
    name: 'Wren',
    title: 'THE ZEPHYR SWIFT',
    role: 'Agile Scout & Twin-Blade Duelist',
    quote: '"The wind bows to no shadow."',
    themeColor: '#10b981',
    accentColor: '#34d399',
    weaponName: 'Zephyr Twin-Daggers',
    startAbility: 'Zephyr Dash & Double Jump',
    abilityDesc: 'Crosses wide chasms and spikes with mid-air dashes and fluid double jumps.',
    stats: {
      speed: 250,
      jump: -445,
      health: 100,
      soul: 100,
      attackSpeed: 'Very Fast',
      damage: 26,
    },
    palette: {
      hair: '#fcd34d',
      skin: '#fed7aa',
      cloak: '#064e3b',
      accent: '#10b981',
      armor: '#047857',
      eyes: '#34d399',
      weapon: '#a7f3d0',
      slashArc: 'rgba(52, 211, 153, 0.85)',
      projectileTint: 0x34d399,
    },
  },

  percy: {
    id: 'percy',
    name: 'Percy',
    title: 'THE IRON RESOLUTE',
    role: 'Armored Vanguard & Shield Maiden',
    quote: '"Stand firm. Nothing breaks our line."',
    themeColor: '#f59e0b',
    accentColor: '#fbbf24',
    weaponName: 'Aegis War-Hammer',
    startAbility: 'Aegis Bash & Ground Slam',
    abilityDesc: 'Smashes cracked stone barriers, deflects projectiles, and stuns heavy foes.',
    stats: {
      speed: 205,
      jump: -415,
      health: 130, // Higher health pool
      soul: 90,
      attackSpeed: 'Heavy & Impactful',
      damage: 34,
    },
    palette: {
      hair: '#92400e',
      skin: '#ffedd5',
      cloak: '#1e3a8a',
      accent: '#f59e0b',
      armor: '#94a3b8',
      eyes: '#fbbf24',
      weapon: '#cbd5e1',
      slashArc: 'rgba(245, 158, 11, 0.85)',
      projectileTint: 0xf59e0b,
    },
  },

  mona: {
    id: 'mona',
    name: 'Mona',
    title: 'THE ASTRAL MYSTIC',
    role: 'Celestial Sorceress & Conduit',
    quote: '"The cosmos remembers what the abyss stole."',
    themeColor: '#a855f7',
    accentColor: '#c084fc',
    weaponName: 'Astral Catalyst Orb',
    startAbility: 'Astral Ray & Soul Surge',
    abilityDesc: 'Fires penetrating astral beams and siphons soul mana to activate ancient runes.',
    stats: {
      speed: 215,
      jump: -425,
      health: 90,
      soul: 140, // High mana pool for spells
      attackSpeed: 'Arcane Cadence',
      damage: 28,
    },
    palette: {
      hair: '#0f172a',
      skin: '#fde68a',
      cloak: '#4c1d95',
      accent: '#a855f7',
      armor: '#312e81',
      eyes: '#e879f9',
      weapon: '#e9d5ff',
      slashArc: 'rgba(168, 85, 247, 0.85)',
      projectileTint: 0xa855f7,
    },
  },

  tilly: {
    id: 'tilly',
    name: 'Tilly',
    title: 'THE EMBER WILDHEART',
    role: 'Acrobatic Trapper & Chain Duelist',
    quote: '"Catch me if you can, beasties!"',
    themeColor: '#ef4444',
    accentColor: '#f87171',
    weaponName: 'Ember Chain-Whip',
    startAbility: 'Grapple Whip & Wall Cling',
    abilityDesc: 'Latches onto overhead gargoyle rings and perches on sheer stone surfaces.',
    stats: {
      speed: 235,
      jump: -435,
      health: 105,
      soul: 100,
      attackSpeed: 'Rapid & Sweeping',
      damage: 27,
    },
    palette: {
      hair: '#ea580c',
      skin: '#fed7aa',
      cloak: '#991b1b',
      accent: '#ef4444',
      armor: '#78350f',
      eyes: '#f87171',
      weapon: '#fca5a5',
      slashArc: 'rgba(239, 68, 68, 0.85)',
      projectileTint: 0xef4444,
    },
  },
};

export class SisterSpriteGenerator {
  static createAllSisterTextures(scene) {
    Object.values(SISTERS_DATA).forEach((sister) => {
      this.createSisterSprites(scene, sister);
      this.createSisterPortrait(scene, sister);
    });
  }

  static makeCanvas(scene, key, width, height, drawFn) {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    scene.textures.addCanvas(key, canvas);
  }

  // --- SPRITE GENERATION FOR A GIVEN SISTER ---
  static createSisterSprites(scene, sister) {
    const { id, palette } = sister;

    // Helper for subtle color lightening
    const lighten = (hex, percent) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
      const B = Math.min(255, (num & 0x0000ff) + amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    };

    const darken = (hex, percent) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
      const B = Math.max(0, (num & 0x0000ff) - amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    };

    // 1. Idle (4 frames: breathing, hair drift, blinking / eye glow pulse)
    [0, 1, 2, 3].forEach((f) => {
      this.makeCanvas(scene, `${id}_idle_${f}`, 48, 64, (ctx) => {
        // Natural breath offsets: 0 -> neutral, 1 -> rising, 2 -> apex, 3 -> settling
        const breathY = [0, -1, -2, -1][f];
        const chestExpand = [0, 0.5, 1, 0.5][f];
        const cloakWave = Math.sin((f / 4) * Math.PI * 2) * 2;
        const hairWave = Math.cos((f / 4) * Math.PI * 2) * 1.5;

        // Ground shadow (soft feathered ellipse)
        const shadowGrad = ctx.createRadialGradient(24, 62, 2, 24, 62, 16);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(24, 62, 16, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cloak back (darker underside + fold highlights)
        const cloakUnder = darken(palette.cloak, 25);
        ctx.fillStyle = cloakUnder;
        ctx.beginPath();
        ctx.moveTo(17, 26 + breathY);
        ctx.lineTo(31, 26 + breathY);
        ctx.lineTo(36 + cloakWave, 59);
        ctx.lineTo(12 - cloakWave * 0.5, 59);
        ctx.closePath();
        ctx.fill();

        // Main Cloak outer drape
        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        ctx.moveTo(18, 26 + breathY);
        ctx.lineTo(30, 26 + breathY);
        ctx.lineTo(34 + cloakWave, 58);
        ctx.lineTo(14 - cloakWave * 0.5, 58);
        ctx.closePath();
        ctx.fill();

        // Cloak edge trim highlight
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(14 - cloakWave * 0.5, 58);
        ctx.lineTo(34 + cloakWave, 58);
        ctx.stroke();

        // Legs / Boots
        const bootDark = darken(palette.armor, 30);
        ctx.fillStyle = bootDark;
        ctx.fillRect(18, 48, 5, 14);
        ctx.fillRect(25, 48, 5, 14);

        // Polished Greaves / Kneecaps
        ctx.fillStyle = palette.armor;
        ctx.fillRect(18, 46, 5, 7);
        ctx.fillRect(25, 46, 5, 7);
        ctx.fillStyle = lighten(palette.armor, 25);
        ctx.fillRect(19, 47, 2, 4);
        ctx.fillRect(26, 47, 2, 4);

        // Armor Torso with natural chest expansion
        const torsoW = 12 + chestExpand;
        const torsoX = 24 - torsoW / 2;
        ctx.fillStyle = palette.armor;
        ctx.fillRect(torsoX, 28 + breathY, torsoW, 20);

        // Curved Breastplate Shading
        const armorGrad = ctx.createLinearGradient(torsoX, 28 + breathY, torsoX + torsoW, 48 + breathY);
        armorGrad.addColorStop(0, lighten(palette.armor, 20));
        armorGrad.addColorStop(0.5, palette.armor);
        armorGrad.addColorStop(1, darken(palette.armor, 30));
        ctx.fillStyle = armorGrad;
        ctx.fillRect(torsoX + 1, 29 + breathY, torsoW - 2, 18);

        // Breastplate / Center Sigil
        ctx.fillStyle = palette.accent;
        ctx.fillRect(21, 31 + breathY, 6, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(23, 33 + breathY, 2, 4); // Runic core shine

        // Cloak Cowl / Shoulder Mantle
        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        ctx.moveTo(15, 24 + breathY);
        ctx.lineTo(33, 24 + breathY);
        ctx.lineTo(29, 37 + breathY);
        ctx.lineTo(19, 37 + breathY);
        ctx.closePath();
        ctx.fill();

        // Golden or Metallic Brooch Clasp
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(24, 27 + breathY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Head / Neck & Face
        ctx.fillStyle = darken(palette.skin, 15); // neck shadow
        ctx.fillRect(22, 24 + breathY, 4, 4);

        ctx.fillStyle = palette.skin;
        ctx.beginPath();
        ctx.arc(24, 19 + breathY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Cheek blush / warmth
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.fillRect(26, 21 + breathY, 3, 2);

        // Hair Base
        ctx.fillStyle = palette.hair;
        ctx.beginPath();
        ctx.arc(24, 17 + breathY, 9, Math.PI * 0.95, Math.PI * 2.05);
        ctx.fill();

        // Distinct Animated Hair & Sister Details
        if (id === 'wren') {
          // Wind-swept twin bangs & ponytail that bobs with breath
          ctx.beginPath();
          ctx.moveTo(17, 18 + breathY);
          ctx.quadraticCurveTo(8 + hairWave, 26 + breathY, 11 + hairWave, 35 + breathY);
          ctx.lineTo(18, 24 + breathY);
          ctx.fill();

          // Hair ribbon tip
          ctx.fillStyle = palette.accent;
          ctx.fillRect(16, 20 + breathY, 3, 2);
        } else if (id === 'percy') {
          // Braided warrior crown with silver circlet
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(18, 14 + breathY, 12, 2.5);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(23, 13 + breathY, 2, 2);

          // Heavy braid falling over left shoulder
          ctx.fillStyle = palette.hair;
          ctx.fillRect(16, 18 + breathY, 4, 18);
          ctx.fillStyle = darken(palette.hair, 20);
          ctx.fillRect(16, 22 + breathY, 4, 1.5);
          ctx.fillRect(16, 27 + breathY, 4, 1.5);
          ctx.fillRect(16, 32 + breathY, 4, 1.5);
        } else if (id === 'mona') {
          // Flowing celestial raven mane with trailing cosmic tendrils
          ctx.beginPath();
          ctx.moveTo(16, 17 + breathY);
          ctx.quadraticCurveTo(9 + hairWave, 28 + breathY, 14 + hairWave, 42 + breathY);
          ctx.lineTo(21, 26 + breathY);
          ctx.fill();

          // Star glint in hair
          ctx.fillStyle = '#e9d5ff';
          ctx.fillRect(14 + hairWave * 0.5, 28 + breathY, 2, 2);
        } else if (id === 'tilly') {
          // Feisty twin side braids with red ribbons
          ctx.fillRect(15, 18 + breathY, 3.5, 15);
          ctx.fillRect(29, 18 + breathY, 3.5, 15);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(15, 27 + breathY, 3.5, 2);
          ctx.fillRect(29, 27 + breathY, 3.5, 2);
        }

        // Glowing Eye (with subtle luminous pulse)
        const eyeAlpha = 0.8 + (f === 2 ? 0.2 : 0);
        ctx.fillStyle = palette.eyes;
        ctx.shadowColor = palette.eyes;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = eyeAlpha;
        ctx.fillRect(26, 18 + breathY, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(27, 18 + breathY, 1, 1); // Iris glint
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Weapon Sheathed / Resting
        if (id === 'wren') {
          // Twin emerald daggers sheathed on hip
          ctx.fillStyle = palette.weapon;
          ctx.fillRect(29, 36 + breathY, 2.5, 11);
          ctx.fillRect(32, 38 + breathY, 2.5, 9);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(28, 35 + breathY, 4, 2);
          ctx.fillRect(31, 37 + breathY, 4, 2);
        } else if (id === 'percy') {
          // Massive Aegis War Hammer strapped to back
          ctx.fillStyle = '#475569';
          ctx.fillRect(11, 14 + breathY, 4, 38);
          // Hammer head with golden flanges
          const hammerGrad = ctx.createLinearGradient(6, 12 + breathY, 19, 22 + breathY);
          hammerGrad.addColorStop(0, '#f59e0b');
          hammerGrad.addColorStop(1, '#78350f');
          ctx.fillStyle = hammerGrad;
          ctx.fillRect(6, 12 + breathY, 14, 10);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(8, 14 + breathY, 10, 2);
        } else if (id === 'mona') {
          // Floating astral orb with gentle levitation sine wave
          const orbFloat = Math.sin((f / 4) * Math.PI * 2) * 3;
          ctx.fillStyle = palette.accent;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(37, 28 + breathY + orbFloat, 4.5, 0, Math.PI * 2);
          ctx.fill();
          // Inner core star
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(37, 28 + breathY + orbFloat, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (id === 'tilly') {
          // Coiled ember chain whip on belt
          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(27, 36 + breathY, 7, 9);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(28, 38 + breathY, 2, 2);
        }
      });
    });

    // 2. Run (8 frames: fluid bipedal locomotion, foot squash, knee drive, cape billow)
    [0, 1, 2, 3, 4, 5, 6, 7].forEach((f) => {
      this.makeCanvas(scene, `${id}_run_${f}`, 48, 64, (ctx) => {
        // Vertical bounce: contacts (0, 4) lower slightly, passing apex (2, 6) rise
        const bob = [1, 0, -2, -1, 1, 0, -2, -1][f];
        // Leg offsets for 8-phase stride cycle
        // f: 0 = R heel strike, 1 = R foot plant/L knee forward, 2 = R toe push/L forward, 3 = flight
        // 4 = L heel strike, 5 = L foot plant/R knee forward, 6 = L toe push/R forward, 7 = flight
        const legR_x = [8, 4, -4, -10, -8, -4, 4, 10][f];
        const legL_x = [-8, -4, 4, 10, 8, 4, -4, -10][f];
        const legR_y = [0, -2, -4, -1, 0, 1, 0, 0][f];
        const legL_y = [0, 1, 0, 0, 0, -2, -4, -1][f];

        // Cloak trailing wave lag
        const cloakWave = Math.sin((f / 8) * Math.PI * 2) * 5;
        const cloakLift = [4, 6, 8, 9, 5, 7, 8, 9][f];

        // Ground shadow (stretches and fades when feet leave ground)
        const shadowW = [16, 14, 10, 8, 16, 14, 10, 8][f];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(24, 62, shadowW, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Billowing Cloak trailing behind runner
        ctx.fillStyle = darken(palette.cloak, 20);
        ctx.beginPath();
        ctx.moveTo(21, 26 + bob);
        ctx.lineTo(31, 26 + bob);
        ctx.quadraticCurveTo(12, 40 + cloakWave, 4 - cloakLift, 48 + cloakWave);
        ctx.lineTo(10, 56);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        ctx.moveTo(22, 27 + bob);
        ctx.lineTo(30, 27 + bob);
        ctx.quadraticCurveTo(14, 38 + cloakWave, 6 - cloakLift, 46 + cloakWave);
        ctx.lineTo(12, 54);
        ctx.closePath();
        ctx.fill();

        // Far Leg (Behind)
        const farLegX = 22 + legL_x * 0.7;
        const farLegY = 46 + bob + legL_y;
        ctx.fillStyle = darken(palette.armor, 35);
        ctx.fillRect(farLegX, farLegY, 5, 14);
        ctx.fillStyle = darken(palette.armor, 45);
        ctx.fillRect(farLegX - 1, farLegY + 11, 7, 4); // Far boot sole

        // Leaned Torso (athletic forward pitch)
        ctx.save();
        ctx.translate(24, 38 + bob);
        ctx.rotate(0.12); // Forward lean angle

        ctx.fillStyle = palette.armor;
        ctx.fillRect(-6, -10, 13, 19);

        // Breastplate Highlight & Sash
        ctx.fillStyle = palette.accent;
        ctx.fillRect(-4, -8, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 2, 4);

        // Cloak collar
        ctx.fillStyle = palette.cloak;
        ctx.fillRect(-7, -12, 14, 6);

        ctx.restore();

        // Near Leg (In front)
        const nearLegX = 22 + legR_x * 0.7;
        const nearLegY = 46 + bob + legR_y;
        ctx.fillStyle = palette.armor;
        ctx.fillRect(nearLegX, nearLegY, 5, 14);
        ctx.fillStyle = lighten(palette.armor, 20);
        ctx.fillRect(nearLegX + 1, nearLegY + 1, 2, 5); // Shin highlight
        ctx.fillStyle = darken(palette.armor, 25);
        ctx.fillRect(nearLegX - 1, nearLegY + 11, 7, 4); // Near boot

        // Head leaned forward into the sprint
        const headX = 26;
        const headY = 19 + bob;
        ctx.fillStyle = palette.skin;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Hair streaming backward in the wind
        ctx.fillStyle = palette.hair;
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 1, 8.5, Math.PI * 0.7, Math.PI * 2.3);
        ctx.fill();

        // Trailing hair banner
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY - 4);
        ctx.quadraticCurveTo(headX - 16, headY + cloakWave * 0.5, headX - 22, headY + 4 + cloakWave * 0.7);
        ctx.lineTo(headX - 8, headY + 5);
        ctx.closePath();
        ctx.fill();

        // Resolute forward-focused eyes
        ctx.fillStyle = palette.eyes;
        ctx.shadowColor = palette.eyes;
        ctx.shadowBlur = 8;
        ctx.fillRect(headX + 2, headY - 1, 4, 2);
        ctx.shadowBlur = 0;

        // Dynamic arm swing / weapon in hand
        ctx.fillStyle = palette.weapon;
        if (id === 'wren') {
          // Daggers held in reverse grip while sprinting
          ctx.strokeStyle = palette.weapon;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(headX + 2, headY + 14);
          ctx.lineTo(headX + 12, headY + 18);
          ctx.stroke();
        } else if (id === 'percy') {
          // Hammer carried ready on shoulder
          ctx.fillStyle = '#64748b';
          ctx.fillRect(headX - 14, headY + 6, 24, 3.5);
          ctx.fillStyle = palette.accent;
          ctx.fillRect(headX - 18, headY + 3, 7, 9);
        } else if (id === 'mona') {
          // Orb trailing behind hand like a celestial comet
          ctx.fillStyle = palette.accent;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(headX - 14, headY + 12 + cloakWave * 0.5, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (id === 'tilly') {
          // Whip handle in hand, cord loosely coiling
          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(headX + 4, headY + 12);
          ctx.quadraticCurveTo(headX + 12, headY + 18, headX + 6, headY + 24);
          ctx.stroke();
        }
      });
    });

    // 3. Air States (Jump Ascent, Apex Crest, Downward Fall)
    // - Jump: Athletic upward launch, arms lifted, cloak trailing downwards
    // - Apex: Tucked center of gravity, aerodynamic transition
    // - Fall: Wind catching cloak billowing upwards, hair lifting, downward gaze
    ['jump', 'apex', 'fall'].forEach((state) => {
      this.makeCanvas(scene, `${id}_${state}`, 48, 64, (ctx) => {
        const isJump = state === 'jump';
        const isApex = state === 'apex';
        const isFall = state === 'fall';

        // Cloak aerodynamics
        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        if (isJump) {
          // Trailing down behind launch
          ctx.moveTo(18, 24);
          ctx.lineTo(30, 24);
          ctx.lineTo(26, 57);
          ctx.lineTo(10, 52);
        } else if (isApex) {
          // Suspended mid-air
          ctx.moveTo(18, 22);
          ctx.lineTo(30, 22);
          ctx.lineTo(34, 52);
          ctx.lineTo(8, 48);
        } else {
          // Billowing UP against rushing downward wind
          ctx.moveTo(18, 26);
          ctx.lineTo(30, 26);
          ctx.lineTo(38, 36);
          ctx.lineTo(32, 20);
          ctx.lineTo(12, 22);
          ctx.lineTo(8, 38);
        }
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.fillStyle = palette.armor;
        if (isJump) {
          // Streamlined trailing legs
          ctx.fillRect(18, 42, 5, 16);
          ctx.fillRect(25, 45, 5, 14);
        } else if (isApex) {
          // Tucked knees
          ctx.fillRect(17, 38, 6, 12);
          ctx.fillRect(24, 38, 6, 12);
        } else {
          // Spread ready for landing impact
          ctx.fillRect(15, 44, 5.5, 15);
          ctx.fillRect(26, 44, 5.5, 15);
        }

        // Torso
        ctx.fillStyle = palette.armor;
        ctx.fillRect(18, 24, 12, 18);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(20, 26, 8, 10);

        // Head
        const headY = isJump ? 16 : (isApex ? 18 : 20);
        ctx.fillStyle = palette.skin;
        ctx.beginPath();
        ctx.arc(24, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Hair reacting to vertical wind
        ctx.fillStyle = palette.hair;
        ctx.beginPath();
        if (isFall) {
          // Hair whipped upwards by falling wind
          ctx.arc(24, headY + 1, 9, Math.PI * 0.8, Math.PI * 2.2);
          ctx.fill();
          ctx.fillRect(14, headY - 10, 16, 8);
        } else {
          ctx.arc(24, headY - 1, 9, Math.PI, Math.PI * 2);
          ctx.fill();
        }

        // Focused eyes
        ctx.fillStyle = palette.eyes;
        ctx.shadowColor = palette.eyes;
        ctx.shadowBlur = 6;
        ctx.fillRect(26, headY, 3, 2);
        ctx.shadowBlur = 0;
      });
    });

    // 4. Attack Slashes (Multi-Frame Keyframed Combo Suite: 4 frames for Atk1, 4 frames for Atk2, 5 frames for Atk3)
    // Anchored at x=24 so character body aligns 100% pixel-perfect with 48px idle/run sprites (via origin 0.375, 0.5)

    // COMBO STEP 1: Fast Swift Cleave (4 frames: Anticipation -> Lunge/Initiation -> Apex Smear -> Follow-Through)
    [0, 1, 2, 3].forEach((f) => {
      this.makeCanvas(scene, `${id}_atk1_${f}`, 64, 64, (ctx) => {
        // Ground shadow
        const shadowW = [16, 18, 22, 18][f];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(24, 62, shadowW, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pose offsets
        const torsoX = [22, 25, 27, 24][f];
        const torsoY = [38, 38, 38, 38][f];
        const lean = [-0.08, 0.12, 0.18, 0.05][f];
        const cloakWave = [-2, 3, 6, 2][f];

        // Billowing Cloak
        ctx.fillStyle = darken(palette.cloak, 20);
        ctx.beginPath();
        ctx.moveTo(torsoX - 3, torsoY - 12);
        ctx.lineTo(torsoX + 6, torsoY - 12);
        ctx.quadraticCurveTo(torsoX - 12, torsoY + 4, torsoX - 16 - cloakWave, 58);
        ctx.lineTo(torsoX - 6, 58);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        ctx.moveTo(torsoX - 2, torsoY - 11);
        ctx.lineTo(torsoX + 5, torsoY - 11);
        ctx.quadraticCurveTo(torsoX - 10, torsoY + 4, torsoX - 14 - cloakWave, 57);
        ctx.lineTo(torsoX - 5, 57);
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.fillStyle = darken(palette.armor, 35);
        if (f === 0) {
          // Coiled back stance
          ctx.fillRect(16, 46, 5, 15);
          ctx.fillRect(25, 46, 5, 15);
        } else if (f === 1) {
          // Driving forward
          ctx.fillRect(14, 46, 5, 15);
          ctx.fillRect(28, 46, 6, 15);
        } else if (f === 2) {
          // Full lunge
          ctx.fillRect(12, 47, 6, 14);
          ctx.fillRect(32, 45, 6, 16);
        } else {
          // Recovery plant
          ctx.fillRect(16, 46, 5, 15);
          ctx.fillRect(27, 46, 5, 15);
        }

        // Torso with rotation
        ctx.save();
        ctx.translate(torsoX, torsoY);
        ctx.rotate(lean);

        ctx.fillStyle = palette.armor;
        ctx.fillRect(-6, -10, 13, 19);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(-4, -8, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 2, 4);

        // Shoulder cowl
        ctx.fillStyle = palette.cloak;
        ctx.fillRect(-7, -12, 14, 5);

        ctx.restore();

        // Head
        const headX = torsoX + (f === 2 ? 3 : (f === 1 ? 1 : 0));
        const headY = 19;
        ctx.fillStyle = palette.skin;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.hair;
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 1, 8.5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();

        // Fierce battle-focus eyes
        ctx.fillStyle = palette.eyes;
        ctx.shadowColor = palette.eyes;
        ctx.shadowBlur = 8;
        ctx.fillRect(headX + 2, headY - 1, 4, 2);
        ctx.shadowBlur = 0;

        // Weapon Rendering & Slash Smear per Frame
        ctx.save();
        if (f === 0) {
          // Anticipation: Weapon coiled back at chest/shoulder, gleaming spark
          if (id === 'wren') {
            ctx.strokeStyle = palette.weapon;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(headX - 2, headY + 12);
            ctx.lineTo(headX - 10, headY + 6);
            ctx.moveTo(headX + 2, headY + 14);
            ctx.lineTo(headX - 6, headY + 20);
            ctx.stroke();
          } else if (id === 'percy') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(headX - 16, headY + 4, 18, 3.5);
            ctx.fillStyle = palette.accent;
            ctx.fillRect(headX - 22, headY + 1, 8, 10);
          } else if (id === 'mona') {
            ctx.fillStyle = palette.accent;
            ctx.shadowColor = palette.accent;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(headX - 8, headY + 10, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (id === 'tilly') {
            ctx.strokeStyle = palette.accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(headX - 8, headY + 10, 6, 8);
          }
          // Runic weapon charge spark
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 10;
          ctx.fillRect(headX - 10, headY + 6, 3, 3);
          ctx.shadowBlur = 0;
        } else if (f === 1) {
          // Initiation: Arm thrusts forward, initial slash curve forming
          const arcGrad = ctx.createLinearGradient(torsoX, 34, torsoX + 24, 34);
          arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          arcGrad.addColorStop(1, palette.slashArc);
          ctx.strokeStyle = arcGrad;
          ctx.lineWidth = 3;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 34, 18, -0.6, 0.4);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (f === 2) {
          // Peak Apex: Full luminous crescent energy smear cutting forward
          const arcGrad = ctx.createRadialGradient(torsoX + 8, 34, 8, torsoX + 8, 34, 32);
          arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          arcGrad.addColorStop(0.5, palette.slashArc);
          arcGrad.addColorStop(0.85, '#ffffff');
          arcGrad.addColorStop(1, palette.accent);
          ctx.fillStyle = arcGrad;
          ctx.beginPath();
          ctx.arc(torsoX + 8, 34, 28, -0.5, 0.65);
          ctx.lineTo(torsoX + 8, 34);
          ctx.fill();

          // Searing cutting edge
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(torsoX + 8, 34, 28, -0.4, 0.6);
          ctx.stroke();

          // Particle sparks peeling off the blade
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(torsoX + 32, 28, 2, 2);
          ctx.fillRect(torsoX + 34, 38, 2.5, 2);
          ctx.fillRect(torsoX + 28, 44, 2, 2);
          ctx.shadowBlur = 0;
        } else {
          // Follow-Through: Arc dissipates into stardust, weapon sweeps to guard
          ctx.strokeStyle = palette.slashArc;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 36, 24, 0.2, 0.8);
          ctx.stroke();

          // Dissipating motes
          ctx.fillStyle = palette.accent;
          ctx.fillRect(torsoX + 24, 38, 2, 2);
          ctx.fillRect(torsoX + 20, 46, 2, 2);
        }
        ctx.restore();
      });
    });

    // COMBO STEP 2: Rising Crescent Uppercut (4 frames: Low Scoop -> Upward Launch -> Skyward Apex -> High Guard)
    [0, 1, 2, 3].forEach((f) => {
      this.makeCanvas(scene, `${id}_atk2_${f}`, 64, 64, (ctx) => {
        // Ground shadow
        const shadowW = [18, 16, 12, 16][f];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(24, 62, shadowW, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vertical bob: f=0 crouch low (+3), f=1 driving up (-2), f=2 peak lift (-4), f=3 landing (0)
        const bob = [3, -2, -4, 0][f];
        const torsoX = [22, 25, 26, 24][f];
        const torsoY = 38 + bob;
        const lean = [-0.12, 0.05, 0.15, 0.02][f];
        const cloakWave = [2, -4, -6, 0][f];

        // Cloak reacting to vertical drive
        ctx.fillStyle = darken(palette.cloak, 20);
        ctx.beginPath();
        ctx.moveTo(torsoX - 3, torsoY - 12);
        ctx.lineTo(torsoX + 6, torsoY - 12);
        ctx.quadraticCurveTo(torsoX - 10, torsoY + 8, torsoX - 12 - cloakWave, 58);
        ctx.lineTo(torsoX - 4, 58);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        ctx.moveTo(torsoX - 2, torsoY - 11);
        ctx.lineTo(torsoX + 5, torsoY - 11);
        ctx.quadraticCurveTo(torsoX - 8, torsoY + 8, torsoX - 10 - cloakWave, 57);
        ctx.lineTo(torsoX - 3, 57);
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.fillStyle = darken(palette.armor, 35);
        if (f === 0) {
          // Deep flexed crouch
          ctx.fillRect(15, 48, 6, 13);
          ctx.fillRect(26, 48, 6, 13);
        } else if (f === 1) {
          // Straightening upward
          ctx.fillRect(18, 44, 5, 17);
          ctx.fillRect(28, 44, 5, 17);
        } else if (f === 2) {
          // Feet lifted off ground
          ctx.fillRect(19, 41, 5, 16);
          ctx.fillRect(27, 41, 5, 16);
        } else {
          // Solid plant
          ctx.fillRect(17, 46, 5, 15);
          ctx.fillRect(27, 46, 5, 15);
        }

        // Torso
        ctx.save();
        ctx.translate(torsoX, torsoY);
        ctx.rotate(lean);
        ctx.fillStyle = palette.armor;
        ctx.fillRect(-6, -10, 13, 19);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(-4, -8, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 2, 4);
        ctx.fillStyle = palette.cloak;
        ctx.fillRect(-7, -12, 14, 5);
        ctx.restore();

        // Head
        const headX = torsoX + (f === 2 ? 2 : 0);
        const headY = 19 + bob;
        ctx.fillStyle = palette.skin;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.hair;
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 1, 8.5, Math.PI * 0.75, Math.PI * 2.25);
        ctx.fill();

        // Upward-angled battle eyes
        ctx.fillStyle = palette.eyes;
        ctx.shadowColor = palette.eyes;
        ctx.shadowBlur = 8;
        ctx.fillRect(headX + 2, headY - 2, 4, 2);
        ctx.shadowBlur = 0;

        // Weapon & Rising Crescent Arc
        ctx.save();
        if (f === 0) {
          // Low scoop anticipation: Weapon lowered near floor behind character
          if (id === 'percy') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(headX - 8, headY + 16, 18, 3.5);
            ctx.fillStyle = palette.accent;
            ctx.fillRect(headX - 12, headY + 14, 7, 8);
          } else if (id === 'wren') {
            ctx.strokeStyle = palette.weapon;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(headX + 2, headY + 16);
            ctx.lineTo(headX - 6, headY + 24);
            ctx.stroke();
          }
          // Ground scrape sparks
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.fillRect(headX - 10, 60, 4, 2);
          ctx.shadowBlur = 0;
        } else if (f === 1) {
          // Rising swing acceleration
          const arcGrad = ctx.createLinearGradient(torsoX, 48, torsoX + 20, 18);
          arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          arcGrad.addColorStop(1, palette.slashArc);
          ctx.strokeStyle = arcGrad;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 32, 22, 0.4, -0.6, true);
          ctx.stroke();
        } else if (f === 2) {
          // Peak Skyward Crescent: Towering vertical crescent smear curving high overhead
          const arcGrad = ctx.createRadialGradient(torsoX + 6, 28, 10, torsoX + 6, 28, 34);
          arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          arcGrad.addColorStop(0.5, palette.slashArc);
          arcGrad.addColorStop(0.85, '#ffffff');
          arcGrad.addColorStop(1, palette.accent);
          ctx.fillStyle = arcGrad;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 28, 30, -1.5, 0.4);
          ctx.lineTo(torsoX + 6, 28);
          ctx.fill();

          // Radiant white leading edge
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 28, 30, -1.4, 0.35);
          ctx.stroke();

          // Airborne sparks
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(torsoX + 18, 6, 2.5, 2.5);
          ctx.fillRect(torsoX + 26, 14, 2, 2);
          ctx.shadowBlur = 0;
        } else {
          // High guard recovery: Dissipating vertical streak
          ctx.strokeStyle = palette.slashArc;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(torsoX + 4, 26, 24, -1.2, -0.4);
          ctx.stroke();
        }
        ctx.restore();
      });
    });

    // COMBO STEP 3: Heavy Finisher / Devastating Breaker (5 frames: Deep Wind-Up -> High Leap -> Meteor Slam -> Ground Shockwave -> Recovery)
    [0, 1, 2, 3, 4].forEach((f) => {
      this.makeCanvas(scene, `${id}_atk3_${f}`, 64, 64, (ctx) => {
        // Ground shadow
        const shadowW = [22, 10, 26, 28, 20][f];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(24, 62, shadowW, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vertical offset: f=0 grounded, f=1 airborne leap (-6), f=2 slam down (+1), f=3 crater (+2), f=4 recovery (0)
        const bob = [0, -6, 1, 2, 0][f];
        const torsoX = [20, 24, 27, 28, 24][f];
        const torsoY = 38 + bob;
        const lean = [-0.15, -0.05, 0.25, 0.2, 0.05][f];
        const cloakWave = [-4, -8, 8, 10, 2][f];

        // Epic Billowing Cloak
        ctx.fillStyle = darken(palette.cloak, 20);
        ctx.beginPath();
        ctx.moveTo(torsoX - 4, torsoY - 12);
        ctx.lineTo(torsoX + 6, torsoY - 12);
        ctx.quadraticCurveTo(torsoX - 14, torsoY + 4, torsoX - 16 - cloakWave, 58);
        ctx.lineTo(torsoX - 4, 58);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = palette.cloak;
        ctx.beginPath();
        ctx.moveTo(torsoX - 3, torsoY - 11);
        ctx.lineTo(torsoX + 5, torsoY - 11);
        ctx.quadraticCurveTo(torsoX - 12, torsoY + 4, torsoX - 14 - cloakWave, 57);
        ctx.lineTo(torsoX - 3, 57);
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.fillStyle = darken(palette.armor, 35);
        if (f === 0) {
          // Deep wide power stance
          ctx.fillRect(10, 47, 7, 14);
          ctx.fillRect(28, 47, 7, 14);
        } else if (f === 1) {
          // Airborne tucked knees
          ctx.fillRect(16, 38, 6, 14);
          ctx.fillRect(25, 38, 6, 14);
        } else if (f === 2) {
          // Heavy slam lunge
          ctx.fillRect(10, 48, 8, 13);
          ctx.fillRect(32, 46, 8, 15);
        } else if (f === 3) {
          // Grounded crater follow-through
          ctx.fillRect(12, 49, 8, 12);
          ctx.fillRect(32, 47, 8, 14);
        } else {
          // Combat recovery stance
          ctx.fillRect(15, 46, 6, 15);
          ctx.fillRect(27, 46, 6, 15);
        }

        // Torso
        ctx.save();
        ctx.translate(torsoX, torsoY);
        ctx.rotate(lean);
        ctx.fillStyle = palette.armor;
        ctx.fillRect(-7, -11, 14, 20);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(-5, -9, 10, 13);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 3, 5);
        ctx.fillStyle = palette.cloak;
        ctx.fillRect(-8, -13, 16, 6);
        ctx.restore();

        // Head
        const headX = torsoX + (f === 2 ? 4 : (f === 1 ? 1 : -1));
        const headY = 18 + bob;
        ctx.fillStyle = palette.skin;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.hair;
        ctx.beginPath();
        ctx.arc(headX - 1, headY - 1, 8.5, Math.PI * 0.7, Math.PI * 2.3);
        ctx.fill();

        // Blazing battle-rage eyes
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = palette.accent;
        ctx.shadowBlur = 12;
        ctx.fillRect(headX + 2, headY - 1, 4, 2);
        ctx.shadowBlur = 0;

        // Weapon & Finisher Smear
        ctx.save();
        if (f === 0) {
          // Heavy two-handed overhead wind-up
          if (id === 'percy') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(headX - 18, headY - 8, 24, 4);
            ctx.fillStyle = palette.accent;
            ctx.fillRect(headX - 24, headY - 12, 10, 12);
          } else if (id === 'wren') {
            ctx.strokeStyle = palette.weapon;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(headX - 4, headY - 2);
            ctx.lineTo(headX - 16, headY - 12);
            ctx.moveTo(headX, headY);
            ctx.lineTo(headX - 12, headY - 14);
            ctx.stroke();
          }
          // Elemental energy crackle around weapon
          ctx.fillStyle = palette.accent;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 14;
          ctx.fillRect(headX - 22, headY - 10, 4, 4);
          ctx.fillRect(headX - 14, headY - 16, 3, 3);
          ctx.shadowBlur = 0;
        } else if (f === 1) {
          // Airborne peak: Weapon poised high overhead like lightning rod
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(headX + 2, headY - 14, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (f === 2) {
          // THE SLAM: Colossal 180° radial energy smear from sky to ground
          const arcGrad = ctx.createRadialGradient(torsoX + 6, 32, 12, torsoX + 6, 32, 38);
          arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          arcGrad.addColorStop(0.5, palette.slashArc);
          arcGrad.addColorStop(0.85, '#ffffff');
          arcGrad.addColorStop(1, palette.accent);
          ctx.fillStyle = arcGrad;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 32, 36, -0.4, 1.7);
          ctx.lineTo(torsoX + 6, 32);
          ctx.fill();

          // Searing shockwave blast edge
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(torsoX + 6, 32, 36, -0.3, 1.65);
          ctx.stroke();

          // Flying debris & heavy sparks
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(torsoX + 36, 42, 3, 3);
          ctx.fillRect(torsoX + 32, 52, 4, 3);
          ctx.fillRect(torsoX + 22, 58, 3, 3);
          ctx.shadowBlur = 0;
        } else if (f === 3) {
          // Ground impact crater & expanding shockwave ring
          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 3;
          ctx.shadowColor = palette.accent;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.ellipse(torsoX + 18, 60, 18, 5, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Forward spark fountain
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(torsoX + 26, 52, 2.5, 2.5);
          ctx.fillRect(torsoX + 32, 48, 2, 2);
          ctx.fillRect(torsoX + 35, 56, 3, 2);
          ctx.shadowBlur = 0;
        } else {
          // Recovery: Settling into combat guard
          ctx.fillStyle = palette.accent;
          ctx.fillRect(torsoX + 16, 52, 2, 2);
        }
        ctx.restore();
      });
    });

    // Backward compatibility aliases
    this.makeCanvas(scene, `${id}_slash_1`, 64, 64, (ctx) => {
      const src = scene.textures.get(`${id}_atk1_2`).getSourceImage();
      ctx.drawImage(src, 0, 0);
    });
    this.makeCanvas(scene, `${id}_slash_2`, 64, 64, (ctx) => {
      const src = scene.textures.get(`${id}_atk2_2`).getSourceImage();
      ctx.drawImage(src, 0, 0);
    });
    this.makeCanvas(scene, `${id}_slash_3`, 64, 64, (ctx) => {
      const src = scene.textures.get(`${id}_atk3_2`).getSourceImage();
      ctx.drawImage(src, 0, 0);
    });

    // 5. Roll / Dash (48x64: high-speed afterimage orb with rotating energy sparks)
    this.makeCanvas(scene, `${id}_roll`, 48, 64, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(24, 62, 18, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer aura burst
      const rollGrad = ctx.createRadialGradient(24, 38, 4, 24, 38, 22);
      rollGrad.addColorStop(0, '#ffffff');
      rollGrad.addColorStop(0.5, palette.accent);
      rollGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rollGrad;
      ctx.beginPath();
      ctx.arc(24, 38, 22, 0, Math.PI * 2);
      ctx.fill();

      // Spinning cloak shadow sphere
      ctx.fillStyle = palette.cloak;
      ctx.beginPath();
      ctx.arc(24, 38, 15, 0, Math.PI * 2);
      ctx.fill();

      // Swirling energy ribbon trails
      ctx.strokeStyle = palette.eyes;
      ctx.lineWidth = 3;
      ctx.shadowColor = palette.eyes;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(24, 38, 12, 0.2, Math.PI * 1.6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 6. Cast (48x64: invoking hands forward with glowing rune glyph)
    this.makeCanvas(scene, `${id}_cast`, 48, 64, (ctx) => {
      ctx.fillStyle = palette.armor;
      ctx.fillRect(18, 28, 12, 20);
      ctx.fillStyle = palette.skin;
      ctx.beginPath();
      ctx.arc(24, 20, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.hair;
      ctx.beginPath();
      ctx.arc(24, 18, 9, Math.PI, Math.PI * 2);
      ctx.fill();

      // Magic sigil aura in front of hands
      const castGrad = ctx.createRadialGradient(38, 28, 2, 38, 28, 16);
      castGrad.addColorStop(0, '#ffffff');
      castGrad.addColorStop(0.5, palette.accent);
      castGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = castGrad;
      ctx.beginPath();
      ctx.arc(38, 28, 16, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Runic Octagon Star
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(33, 23, 10, 10);
      ctx.save();
      ctx.translate(38, 28);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();
    });

    // 7. Hurt (48x64: dynamic knockback silhouette with crimson pain flash)
    this.makeCanvas(scene, `${id}_hurt`, 48, 64, (ctx) => {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.beginPath();
      ctx.arc(20, 20, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(14, 28, 13, 20);
      ctx.fillRect(13, 48, 6, 14);
      ctx.fillRect(22, 46, 6, 16);

      // White impact slash
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 16);
      ctx.lineTo(34, 44);
      ctx.stroke();
    });
  }

  // --- DETAILED 80x80 BUST PORTRAITS FOR CHARACTER SELECT SCREEN ---
  static createSisterPortrait(scene, sister) {
    const { id, palette } = sister;

    this.makeCanvas(scene, `${id}_portrait`, 80, 80, (ctx) => {
      // Dark gothic portrait frame background
      const grad = ctx.createRadialGradient(40, 40, 6, 40, 40, 39);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.65, '#0b0d17');
      grad.addColorStop(1, '#05070e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 80, 80);

      // Outer gilded ornate ring
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(40, 40, 37, 0, Math.PI * 2);
      ctx.stroke();

      // Thematic aura halo
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 2;
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(40, 40, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Shoulders & Armor with gradient depth
      const shoulderGrad = ctx.createLinearGradient(15, 52, 65, 80);
      shoulderGrad.addColorStop(0, palette.armor);
      shoulderGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = shoulderGrad;
      ctx.beginPath();
      ctx.moveTo(14, 80);
      ctx.lineTo(24, 52);
      ctx.lineTo(56, 52);
      ctx.lineTo(66, 80);
      ctx.closePath();
      ctx.fill();

      // Armor Pauldrons / Highlights
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(22, 54);
      ctx.lineTo(32, 62);
      ctx.moveTo(58, 54);
      ctx.lineTo(48, 62);
      ctx.stroke();

      // Cloak collar
      ctx.fillStyle = palette.cloak;
      ctx.beginPath();
      ctx.moveTo(24, 54);
      ctx.lineTo(40, 70);
      ctx.lineTo(56, 54);
      ctx.closePath();
      ctx.fill();

      // Neck & Face
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(36, 46, 8, 8);
      ctx.beginPath();
      ctx.arc(40, 36, 14, 0, Math.PI * 2);
      ctx.fill();

      // Rosy cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.fillRect(30, 39, 4, 3);
      ctx.fillRect(46, 39, 4, 3);

      // Hair
      ctx.fillStyle = palette.hair;
      ctx.beginPath();
      ctx.arc(40, 34, 16.5, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();

      // Distinctive hair flair per sister
      if (id === 'wren') {
        // Feathery wind-swept locks
        ctx.beginPath();
        ctx.moveTo(25, 32);
        ctx.quadraticCurveTo(14, 46, 18, 60);
        ctx.lineTo(30, 42);
        ctx.fill();
      } else if (id === 'percy') {
        // Braided warrior hair + silver crown
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(27, 24, 26, 3.5);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(38, 23, 4, 3);
        ctx.fillStyle = palette.hair;
        ctx.fillRect(23, 34, 4.5, 26);
        ctx.fillRect(52, 34, 4.5, 26);
      } else if (id === 'mona') {
        // Flowing obsidian locks + crescent diadem
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(40, 24, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(40, 24, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = palette.hair;
        ctx.fillRect(21, 34, 5.5, 30);
        ctx.fillRect(53, 34, 5.5, 30);
      } else if (id === 'tilly') {
        // Orange twin braids with crimson ribbons
        ctx.fillRect(21, 34, 5.5, 28);
        ctx.fillRect(53, 34, 5.5, 28);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(21, 50, 5.5, 3);
        ctx.fillRect(53, 50, 5.5, 3);
      }

      // Glowing Eyes with reflective iris gleams
      ctx.fillStyle = palette.eyes;
      ctx.shadowColor = palette.eyes;
      ctx.shadowBlur = 10;
      ctx.fillRect(32, 34, 5, 3.5);
      ctx.fillRect(43, 34, 5, 3.5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(34, 34, 2, 2);
      ctx.fillRect(45, 34, 2, 2);
      ctx.shadowBlur = 0;
    });
  }
}


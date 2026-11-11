import Phaser from 'phaser';
import { SISTERS_DATA } from '../utils/SisterSpriteGenerator.js';
import { soundFX } from '../audio/SoundFX.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.sisterId = 'wren';
    this.sisterData = SISTERS_DATA.wren;
    this.isMenuOpen = false;
    this.discoveredCells = new Set();
    this.currentBiome = 'catacombs';
    this.isFullMapOpen = false;
  }

  init(data) {
    if (data && data.sisterId) {
      this.sisterId = data.sisterId;
      this.sisterData = SISTERS_DATA[this.sisterId] || SISTERS_DATA.wren;
    }
    this.isMenuOpen = false;
    this.isFullMapOpen = false;
    this.activeInputType = 'keyboard';
    this.currentModalFocus = null;
    this.prevPadButtons = {};
    this.lastNavTime = 0;
  }

  create() {
    this.createHUD();
    this.createSigilsHUD();
    this.createMenuButton();
    this.createAudioButton();
    this.createGamepadIndicator();
    this.createMiniMap();
    this.createSubRegionPill();
    this.createBiomeBanner();
    this.createFullMapModal();
    this.createLeylineModal();
    this.createMenuModal();
    this.createBossBar();
    this.setupListeners();
    this.createTouchControls();

    // ESC key to toggle menu or cancel active modal
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.currentModalFocus && this.currentModalFocus.onCancel) {
        this.currentModalFocus.onCancel();
      } else {
        this.toggleMenu();
      }
    });
    this.input.keyboard.on('keydown-P', () => this.toggleMenu());
    this.input.keyboard.on('keydown-M', () => this.toggleFullMap());

    // Hybrid keyboard navigation for active modals
    this.input.keyboard.on('keydown', (event) => {
      if (!this.currentModalFocus) return;
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        this.moveModalFocus('up');
      } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        this.moveModalFocus('down');
      } else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        this.moveModalFocus('left');
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        this.moveModalFocus('right');
      } else if (event.key === 'Enter' || event.key === ' ') {
        this.triggerModalSelect();
      }
    });
  }

  // --- MODAL CONTROLLER & KEYBOARD FOCUS SYSTEM ---
  setModalFocus(config) {
    if (this.currentModalFocus && this.currentModalFocus.items) {
      const prev = this.currentModalFocus.items[this.currentModalFocus.selectedIndex];
      if (prev && prev.setHover) {
        try { prev.setHover(false); } catch (e) {}
      }
    }

    this.currentModalFocus = {
      id: config.id || 'modal',
      items: config.items || [],
      selectedIndex: config.selectedIndex || 0,
      orientation: config.orientation || 'vertical',
      onCancel: config.onCancel || null,
    };

    if (this.currentModalFocus.items.length > 0) {
      if (this.currentModalFocus.selectedIndex >= this.currentModalFocus.items.length) {
        this.currentModalFocus.selectedIndex = 0;
      }
      const active = this.currentModalFocus.items[this.currentModalFocus.selectedIndex];
      if (active && active.setHover) {
        try { active.setHover(true); } catch (e) {}
      }
    }
  }

  clearModalFocus(id = null) {
    if (!this.currentModalFocus) return;
    if (id && this.currentModalFocus.id !== id) return;

    if (this.currentModalFocus.items) {
      const prev = this.currentModalFocus.items[this.currentModalFocus.selectedIndex];
      if (prev && prev.setHover) {
        try { prev.setHover(false); } catch (e) {}
      }
    }
    this.currentModalFocus = null;
  }

  moveModalFocus(dir) {
    if (!this.currentModalFocus || !this.currentModalFocus.items || this.currentModalFocus.items.length === 0) return;

    const items = this.currentModalFocus.items;
    const len = items.length;
    const cur = this.currentModalFocus.selectedIndex;
    let next = cur;

    const orientation = this.currentModalFocus.orientation || 'vertical';

    if (orientation === 'vertical') {
      if (dir === 'up' || dir === 'left') {
        next = (cur - 1 + len) % len;
      } else if (dir === 'down' || dir === 'right') {
        next = (cur + 1) % len;
      }
    } else if (orientation === 'horizontal') {
      if (dir === 'left' || dir === 'up') {
        next = (cur - 1 + len) % len;
      } else if (dir === 'right' || dir === 'down') {
        next = (cur + 1) % len;
      }
    } else {
      if (dir === 'left' || dir === 'up') {
        next = (cur - 1 + len) % len;
      } else if (dir === 'right' || dir === 'down') {
        next = (cur + 1) % len;
      }
    }

    if (next !== cur) {
      if (items[cur] && items[cur].setHover) {
        try { items[cur].setHover(false); } catch (e) {}
      }
      this.currentModalFocus.selectedIndex = next;
      if (items[next] && items[next].setHover) {
        try { items[next].setHover(true); } catch (e) {}
      }
      soundFX.playSlash(1);
    }
  }

  triggerModalSelect() {
    if (!this.currentModalFocus) return;
    const items = this.currentModalFocus.items;
    if (!items || items.length === 0) {
      if (this.currentModalFocus.onCancel) {
        try { this.currentModalFocus.onCancel(); } catch (e) {}
      }
      return;
    }

    const cur = this.currentModalFocus.selectedIndex;
    const activeItem = items[cur];
    if (activeItem && activeItem.clickFn) {
      try {
        activeItem.clickFn();
      } catch (err) {
        console.error('[UIScene] Error executing modal action:', err);
      }
    }
  }

  triggerModalCancel() {
    if (!this.currentModalFocus) {
      if (this.isMenuOpen) this.closeMenu();
      else if (this.isFullMapOpen) this.closeFullMap();
      return;
    }
    if (this.currentModalFocus.onCancel) {
      try {
        this.currentModalFocus.onCancel();
      } catch (err) {
        console.error('[UIScene] Error executing modal cancel:', err);
      }
    }
  }

  // UIScene update loop: remains active even when GameScene is paused!
  update(time, delta) {
    this.pollGamepadInputs(time, delta);
  }

  pollGamepadInputs(time, delta) {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    let pad = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        pad = gamepads[i];
        break;
      }
    }

    if (!pad) {
      this.prevPadButtons = {};
      return;
    }

    const stickX = pad.axes[0] || 0;
    const stickY = pad.axes[1] || 0;
    const deadzone = 0.38;

    const dpadUp = !!(pad.buttons[12] && pad.buttons[12].pressed);
    const dpadDown = !!(pad.buttons[13] && pad.buttons[13].pressed);
    const dpadLeft = !!(pad.buttons[14] && pad.buttons[14].pressed);
    const dpadRight = !!(pad.buttons[15] && pad.buttons[15].pressed);

    const btnA = !!(pad.buttons[0] && (pad.buttons[0].pressed || pad.buttons[0].value > 0.4));
    const btnB = !!(pad.buttons[1] && (pad.buttons[1].pressed || pad.buttons[1].value > 0.4));
    const btnStart = !!(pad.buttons[9] && (pad.buttons[9].pressed || pad.buttons[9].value > 0.4));
    const btnSelect = !!(pad.buttons[8] && (pad.buttons[8].pressed || pad.buttons[8].value > 0.4));

    const isUp = dpadUp || stickY < -deadzone;
    const isDown = dpadDown || stickY > deadzone;
    const isLeft = dpadLeft || stickX < -deadzone;
    const isRight = dpadRight || stickX > deadzone;

    // Dynamically switch active input type to gamepad
    if (btnA || btnB || btnStart || btnSelect || isUp || isDown || isLeft || isRight) {
      if (this.activeInputType !== 'gamepad') {
        this.activeInputType = 'gamepad';
        this.renderAbilityBar();
        if (this.gamepadIcon) this.gamepadIcon.setAlpha(1.0);
      }
    }

    // Modal navigation handling
    if (this.currentModalFocus) {
      const now = time || performance.now();
      const canNavigate = !this.lastNavTime || (now - this.lastNavTime > 220);

      if (canNavigate) {
        if (isUp) {
          this.moveModalFocus('up');
          this.lastNavTime = now;
        } else if (isDown) {
          this.moveModalFocus('down');
          this.lastNavTime = now;
        } else if (isLeft) {
          this.moveModalFocus('left');
          this.lastNavTime = now;
        } else if (isRight) {
          this.moveModalFocus('right');
          this.lastNavTime = now;
        }
      }

      if (!isUp && !isDown && !isLeft && !isRight) {
        this.lastNavTime = 0;
      }

      // Edge-triggered Confirm Button A
      if (btnA && !this.prevPadButtons.btnA) {
        this.triggerModalSelect();
      }

      // Edge-triggered Cancel / Back Button B
      if (btnB && !this.prevPadButtons.btnB) {
        this.triggerModalCancel();
      }

      // Edge-triggered Start Button (also acts as Back / Resume in menus)
      if (btnStart && !this.prevPadButtons.btnStart) {
        this.triggerModalCancel();
      }
    } else {
      // If modal focus wasn't captured, but menu or map is visible
      if (this.isMenuOpen) {
        if (btnB && !this.prevPadButtons.btnB) this.closeMenu();
        if (btnStart && !this.prevPadButtons.btnStart) this.closeMenu();
      } else if (this.isFullMapOpen) {
        if (btnB && !this.prevPadButtons.btnB) this.closeFullMap();
        if (btnSelect && !this.prevPadButtons.btnSelect) this.closeFullMap();
        if (btnStart && !this.prevPadButtons.btnStart) this.closeFullMap();
      }
    }

    this.prevPadButtons = {
      btnA,
      btnB,
      btnStart,
      btnSelect,
      isUp,
      isDown,
      isLeft,
      isRight,
    };
  }

  createHUD() {
    // HUD Container top-left
    this.hudContainer = this.add.container(24, 20);

    // Dark gothic plaque background
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x0b0d14, 0.85);
    this.hudBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.sisterData.themeColor).color, 0.9);
    this.hudBg.fillRoundedRect(0, 0, 260, 80, 8);
    this.hudBg.strokeRoundedRect(0, 0, 260, 80, 8);
    this.hudContainer.add(this.hudBg);

    // Hero Avatar / Crest with Sister Portrait
    this.hudCrest = this.add.graphics();
    this.hudCrest.fillStyle(0x1e1b4b, 1);
    this.hudCrest.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.sisterData.accentColor).color, 1);
    this.hudCrest.fillCircle(28, 40, 20);
    this.hudCrest.strokeCircle(28, 40, 20);
    this.hudContainer.add(this.hudCrest);

    // Portrait image
    this.hudPortrait = this.add.image(28, 40, `${this.sisterId}_portrait`);
    this.hudPortrait.setDisplaySize(38, 38);
    this.hudContainer.add(this.hudPortrait);

    // Hero Name & Title
    this.hudTitle = this.add.text(56, 10, `${this.sisterData.name.toUpperCase()} — ${this.sisterData.title}`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: this.sisterData.themeColor,
      letterSpacing: 1.5,
    });
    this.hudContainer.add(this.hudTitle);

    // Health Bar Frame
    const hpFrame = this.add.graphics();
    hpFrame.fillStyle(0x1a060b, 1);
    hpFrame.lineStyle(1, 0x7f1d1d, 1);
    hpFrame.fillRoundedRect(56, 28, 160, 14, 3);
    hpFrame.strokeRoundedRect(56, 28, 160, 14, 3);
    this.hudContainer.add(hpFrame);

    // Health Bar Fill
    this.hpBar = this.add.graphics();
    this.hudContainer.add(this.hpBar);

    // Health Text
    this.hpText = this.add.text(136, 29, `${this.sisterData.stats.health} / ${this.sisterData.stats.health}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.hpText);

    this.updateHealthBar(this.sisterData.stats.health, this.sisterData.stats.health);

    // Soul / Mana Bar Frame
    const mpFrame = this.add.graphics();
    mpFrame.fillStyle(0x061524, 1);
    mpFrame.lineStyle(1, 0x0369a1, 1);
    mpFrame.fillRoundedRect(56, 48, 160, 10, 3);
    mpFrame.strokeRoundedRect(56, 48, 160, 10, 3);
    this.hudContainer.add(mpFrame);

    // Soul Bar Fill
    this.soulBar = this.add.graphics();
    this.hudContainer.add(this.soulBar);

    // Soul Text
    this.soulText = this.add.text(136, 48, `SOUL: 50 / ${this.sisterData.stats.soul}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      color: '#67e8f9',
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.soulText);

    this.updateSoulBar(50, this.sisterData.stats.soul);

    // Quick Ability Bar (bottom left)
    this.createAbilityBar();
  }

  // =========================================================================
  // PHASE 6.5: PRIMORDIAL SIGILS & RELIC KEYS HUD
  // =========================================================================
  createSigilsHUD() {
    this.sigilsHudContainer = this.add.container(295, 20);
    this.sigilsHudContainer.setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x07090e, 0.88);
    bg.lineStyle(1.5, 0x475569, 0.8);
    bg.fillRoundedRect(0, 0, 168, 48, 6);
    bg.strokeRoundedRect(0, 0, 168, 48, 6);
    this.sigilsHudContainer.add(bg);

    const title = this.add.text(84, 5, 'PRIMORDIAL SIGILS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8px',
      color: '#94a3b8',
      letterSpacing: 1,
    }).setOrigin(0.5, 0);
    this.sigilsHudContainer.add(title);

    // Sigil Medallion Slots (4 slots: Crypt, Prism, Forge, Gale)
    this.sigilSlots = {};
    const sigilDefs = [
      { id: 'sigil_crypt', name: 'Crypt', color: 0x38bdf8, hex: '#38bdf8', icon: '💀' },
      { id: 'sigil_prism', name: 'Prism', color: 0xc084fc, hex: '#c084fc', icon: '💎' },
      { id: 'sigil_forge', name: 'Forge', color: 0xf97316, hex: '#f97316', icon: '🔥' },
      { id: 'sigil_gale', name: 'Gale', color: 0x10b981, hex: '#10b981', icon: '🌪️' },
    ];

    sigilDefs.forEach((s, idx) => {
      const sx = 22 + idx * 41;
      const sy = 28;

      const slotBg = this.add.graphics();
      slotBg.fillStyle(0x0b0f19, 0.9);
      slotBg.lineStyle(1, 0x334155, 0.6);
      slotBg.fillCircle(sx, sy, 12);
      slotBg.strokeCircle(sx, sy, 12);
      this.sigilsHudContainer.add(slotBg);

      const icon = this.add.text(sx, sy, s.icon, {
        fontSize: '11px',
      }).setOrigin(0.5);
      icon.setAlpha(0.25);
      this.sigilsHudContainer.add(icon);

      this.sigilSlots[s.id] = { slotBg, icon, sx, sy, def: s };
    });

    // Relic Keys Row (compact key badges just below the sigil plaque)
    this.keyBadgesContainer = this.add.container(295, 72);
    this.keyBadgesContainer.setDepth(100);

    this.updateSigilsHUD();
  }

  updateSigilsHUD() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;

    const collectedSigils = gameScene.collectedSigils || new Set();
    const collectedKeys = gameScene.collectedKeys || new Set();

    // Update Sigils
    for (const id in this.sigilSlots) {
      const slot = this.sigilSlots[id];
      const hasSigil = collectedSigils.has(id);
      if (hasSigil) {
        slot.slotBg.clear();
        slot.slotBg.fillStyle(slot.def.color, 0.25);
        slot.slotBg.lineStyle(2, slot.def.color, 1.0);
        slot.slotBg.fillCircle(slot.sx, slot.sy, 12);
        slot.slotBg.strokeCircle(slot.sx, slot.sy, 12);
        slot.icon.setAlpha(1.0);
      } else {
        slot.slotBg.clear();
        slot.slotBg.fillStyle(0x0b0f19, 0.9);
        slot.slotBg.lineStyle(1, 0x334155, 0.6);
        slot.slotBg.fillCircle(slot.sx, slot.sy, 12);
        slot.slotBg.strokeCircle(slot.sx, slot.sy, 12);
        slot.icon.setAlpha(0.25);
      }
    }

    // Update Relic Keys
    if (this.keyBadgesContainer) {
      this.keyBadgesContainer.removeAll(true);
      if (collectedKeys.size > 0) {
        const keyList = Array.from(collectedKeys);
        keyList.forEach((kId, idx) => {
          const kx = idx * 38;
          const badge = this.add.graphics();
          badge.fillStyle(0x07090e, 0.9);
          badge.lineStyle(1, 0xfbbf24, 0.8);
          badge.fillRoundedRect(kx, 0, 34, 18, 4);
          badge.strokeRoundedRect(kx, 0, 34, 18, 4);
          this.keyBadgesContainer.add(badge);

          const keyText = this.add.text(kx + 17, 9, '🔑', {
            fontSize: '10px',
          }).setOrigin(0.5);
          this.keyBadgesContainer.add(keyText);
        });
      }
    }
  }

  createAbilityBar() {
    const bottomY = this.scale.height - 38;
    this.abilityBarContainer = this.add.container(24, bottomY);
    this.renderAbilityBar();
  }

  renderAbilityBar(abilities = null) {
    this.abilityBarContainer.removeAll(true);

    const gameScene = this.scene.get('GameScene');
    const playerAbilities = abilities || (gameScene && gameScene.player ? gameScene.player.abilities : {
      dash: this.sisterId === 'wren',
      shieldBash: this.sisterId === 'percy',
      astralRay: this.sisterId === 'mona',
      grapple: this.sisterId === 'tilly',
    });

    const isGamepad = this.activeInputType === 'gamepad';
    const items = [
      { id: 'attack', key: isGamepad ? '[X]' : 'Z/J', label: 'ATTACK', icon: '⚔️', unlocked: true, color: 0x94a3b8 },
      { id: 'cast', key: isGamepad ? '[Y]' : 'X/Q', label: 'SOUL BOLT', icon: '🔮', unlocked: true, color: 0x38bdf8 },
      { id: 'dash', key: isGamepad ? '[RT]' : 'SHIFT', label: 'AIR DASH', icon: '💨', unlocked: playerAbilities.dash, color: 0x10b981 },
      { id: 'shieldBash', key: isGamepad ? '[LT]' : 'F/U', label: 'AEGIS BASH', icon: '🛡️', unlocked: playerAbilities.shieldBash, color: 0xf59e0b },
      { id: 'astralRay', key: isGamepad ? '[LB]' : 'R/I', label: 'ASTRAL RAY', icon: '✨', unlocked: playerAbilities.astralRay, color: 0xa855f7 },
      { id: 'grapple', key: isGamepad ? '[R3]' : 'V/O', label: 'GRAPPLE', icon: '⛓️', unlocked: playerAbilities.grapple, color: 0xef4444 },
    ];

    items.forEach((item, i) => {
      const x = i * 94;
      const slot = this.add.graphics();
      if (item.unlocked) {
        slot.fillStyle(0x0b0d14, 0.9);
        slot.lineStyle(1.5, item.color, 0.95);
      } else {
        slot.fillStyle(0x05060a, 0.6);
        slot.lineStyle(1, 0x334155, 0.5);
      }
      slot.fillRoundedRect(x, 0, 88, 28, 4);
      slot.strokeRoundedRect(x, 0, 88, 28, 4);
      this.abilityBarContainer.add(slot);

      const label = item.unlocked ? `${item.icon} ${item.key}` : `🔒 ${item.key}`;
      const txt = this.add.text(x + 44, 14, label, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '10px',
        fontStyle: item.unlocked ? 'bold' : 'normal',
        color: item.unlocked ? '#ffffff' : '#64748b',
      }).setOrigin(0.5);
      this.abilityBarContainer.add(txt);
    });
  }

  createAudioButton() {
    const w = this.scale.width;
    const x = w - 165;
    const y = 36;
    const btnW = 38;
    const btnH = 32;

    this.audioBtnContainer = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x0b0d14, 0.85);
    bg.lineStyle(1.5, 0x475569, 0.9);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    this.audioBtnContainer.add(bg);

    this.audioIcon = this.add.text(0, 0, soundFX.muted ? '🔇' : '🔊', {
      fontSize: '14px',
    }).setOrigin(0.5);
    this.audioBtnContainer.add(this.audioIcon);

    this.audioBtnContainer.setSize(btnW, btnH);
    this.audioBtnContainer.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    this.audioBtnContainer.on('pointerdown', () => {
      const isMuted = soundFX.toggleMute();
      this.audioIcon.setText(isMuted ? '🔇' : '🔊');
      this.showToast(isMuted ? '🔇 AUDIO MUTED' : '🔊 AUDIO UNMUTED');
    });
  }

  createGamepadIndicator() {
    const w = this.scale.width;
    const x = w - 212;
    const y = 36;
    const btnW = 38;
    const btnH = 32;

    this.gamepadIconContainer = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x0b0d14, 0.85);
    bg.lineStyle(1.5, 0x475569, 0.9);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    this.gamepadIconContainer.add(bg);

    this.gamepadIcon = this.add.text(0, 0, '🎮', {
      fontSize: '13px',
    }).setOrigin(0.5).setAlpha(0.35);
    this.gamepadIconContainer.add(this.gamepadIcon);
  }

  createMenuButton() {
    const w = this.scale.width;
    const btnWidth = 104;
    const btnHeight = 32;
    const x = w - btnWidth / 2 - 24;
    const y = 36;

    this.menuBtnContainer = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0b0d14, 0.85);
    bg.lineStyle(1.5, 0x475569, 0.9);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    this.menuBtnContainer.add(bg);

    const txt = this.add.text(0, 0, '⚙ MENU', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.menuBtnContainer.add(txt);

    this.menuBtnContainer.setSize(btnWidth, btnHeight);
    this.menuBtnContainer.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight),
      Phaser.Geom.Rectangle.Contains
    );

    this.menuBtnContainer.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e1b4b, 0.95);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.sisterData.accentColor).color, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      txt.setColor('#ffffff');
    });

    this.menuBtnContainer.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0b0d14, 0.85);
      bg.lineStyle(1.5, 0x475569, 0.9);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      txt.setColor('#cbd5e1');
    });

    this.menuBtnContainer.on('pointerdown', () => {
      this.toggleMenu();
    });
  }

  createMenuModal() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.menuModal = this.add.container(0, 0);
    this.menuModal.setDepth(1000);
    this.menuModal.setVisible(false);

    // Full screen blocker backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x030308, 0.88);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    this.menuModal.add(backdrop);

    // Dialog card
    const cardW = 440;
    const cardH = 460;
    const cx = w / 2;
    const cy = h / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0c16, 0.98);
    panel.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.sisterData.themeColor).color, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    this.menuModal.add(panel);

    // Header Title
    const title = this.add.text(cx, cy - cardH / 2 + 40, 'SANCTUARY RETREAT', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 4,
      shadow: { color: this.sisterData.themeColor, blur: 12, fill: true },
    }).setOrigin(0.5);
    this.menuModal.add(title);

    const subtitle = this.add.text(cx, cy - cardH / 2 + 68, `GAME PAUSED — ${this.sisterData.name.toUpperCase()} (${this.sisterData.title.toUpperCase()})`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: this.sisterData.themeColor,
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.menuModal.add(subtitle);

    const gameScene = this.scene.get('GameScene');

    // Menu Actions
    const buttons = [
      {
        label: '▶ RESUME GAME (ESC / START)',
        bgColor: 0x1e293b,
        hoverColor: 0x334155,
        strokeColor: 0x64748b,
        callback: () => this.closeMenu(),
      },
      {
        label: '💾 SAVE PROGRESS',
        bgColor: 0x064e3b,
        hoverColor: 0x059669,
        strokeColor: 0x10b981,
        callback: () => {
          if (gameScene && gameScene.saveProgress) {
            gameScene.saveProgress();
          }
        },
      },
      {
        label: soundFX.muted ? '🔇 AUDIO: MUTED' : '🔊 AUDIO: ENABLED',
        bgColor: 0x1e1b4b,
        hoverColor: 0x312e81,
        strokeColor: 0x818cf8,
        callback: () => {
          const isMuted = soundFX.toggleMute();
          if (this.audioIcon) this.audioIcon.setText(isMuted ? '🔇' : '🔊');
          this.closeMenu();
          this.openMenu();
        },
      },
      {
        label: '👥 CHOOSE SISTER',
        bgColor: 0x4c1d95,
        hoverColor: 0x7c3aed,
        strokeColor: 0xc084fc,
        callback: () => this.goToCharacterSelect(),
      },
      {
        label: '⚔️ TITLE SCREEN',
        bgColor: 0x111827,
        hoverColor: 0x1f2937,
        strokeColor: 0x4b5563,
        callback: () => this.goToMainMenu(),
      },
    ];

    const btnStartX = cx;
    const btnStartY = cy - 78;
    const btnGap = 44;
    const btnW = 320;
    const btnH = 34;

    this.menuModalButtons = [];

    buttons.forEach((b, i) => {
      const by = btnStartY + i * btnGap;
      const btnContainer = this.add.container(btnStartX, by);

      const bBg = this.add.graphics();
      bBg.fillStyle(b.bgColor, 0.95);
      bBg.lineStyle(1.5, b.strokeColor, 0.9);
      bBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      bBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      btnContainer.add(bBg);

      const bTxt = this.add.text(0, 0, b.label, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
      }).setOrigin(0.5);
      btnContainer.add(bTxt);

      // In-place label update support for audio button
      if (b.label.includes('AUDIO')) {
        const origCb = b.callback;
        b.callback = () => {
          const isMuted = soundFX.toggleMute();
          if (this.audioIcon) this.audioIcon.setText(isMuted ? '🔇' : '🔊');
          bTxt.setText(isMuted ? '🔇 AUDIO: MUTED' : '🔊 AUDIO: ENABLED');
          this.showToast(isMuted ? '🔇 AUDIO MUTED' : '🔊 AUDIO UNMUTED');
        };
      }

      btnContainer.setSize(btnW, btnH);
      btnContainer.setInteractive(
        new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
        Phaser.Geom.Rectangle.Contains
      );

      const setHover = (hover) => {
        bBg.clear();
        bBg.fillStyle(hover ? b.hoverColor : b.bgColor, hover ? 1 : 0.95);
        bBg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : b.strokeColor, 1);
        bBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        bBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        bTxt.setScale(hover ? 1.05 : 1.0);
        bTxt.setColor(hover ? '#ffffff' : '#cbd5e1');
      };

      btnContainer.on('pointerover', () => {
        if (this.currentModalFocus && this.currentModalFocus.id === 'pause_menu') {
          if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
            this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
          }
          this.currentModalFocus.selectedIndex = i;
        }
        setHover(true);
      });

      btnContainer.on('pointerout', () => {
        if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== i) {
          setHover(false);
        }
      });

      btnContainer.on('pointerdown', () => {
        soundFX.playCollect();
        b.callback();
      });

      this.menuModal.add(btnContainer);
      this.menuModalButtons.push({
        container: btnContainer,
        setHover,
        clickFn: () => {
          soundFX.playCollect();
          b.callback();
        },
      });
    });

    // Controller navigation prompt at bottom
    const controlsNote = this.add.text(cx, cy + cardH / 2 - 28, '🎮 [D-Pad / Stick] Navigate  •  [A] Select  •  [B / Start] Resume Game', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);
    this.menuModal.add(controlsNote);
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isMenuOpen = true;
    this.menuModal.setVisible(true);
    soundFX.playCollect();
    this.scene.pause('GameScene');
    this.setModalFocus({
      id: 'pause_menu',
      items: this.menuModalButtons,
      selectedIndex: 0,
      orientation: 'vertical',
      onCancel: () => this.closeMenu(),
    });
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.menuModal.setVisible(false);
    this.clearModalFocus('pause_menu');
    this.scene.resume('GameScene');
  }

  restartGame() {
    this.isMenuOpen = false;
    this.menuModal.setVisible(false);
    this.scene.resume('GameScene');
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene', { sisterId: this.sisterId });
    this.scene.start('UIScene', { sisterId: this.sisterId });
  }

  goToCharacterSelect() {
    this.isMenuOpen = false;
    this.menuModal.setVisible(false);
    this.scene.resume('GameScene');
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('CharacterSelectScene');
  }

  goToMainMenu() {
    this.isMenuOpen = false;
    this.menuModal.setVisible(false);
    this.scene.resume('GameScene');
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }

  createBossBar() {
    this.bossContainer = this.add.container(this.scale.width / 2, 45);
    this.bossContainer.setVisible(false);

    // Boss Name Title
    this.bossTitle = this.add.text(0, -18, 'MALAKOR, THE ABYSSAL KNIGHT', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f43f5e',
      letterSpacing: 3,
    }).setOrigin(0.5);
    this.bossContainer.add(this.bossTitle);

    // Frame
    const frame = this.add.graphics();
    frame.fillStyle(0x180b1e, 0.9);
    frame.lineStyle(2, 0xa855f7, 0.95);
    frame.fillRoundedRect(-180, 0, 360, 16, 4);
    frame.strokeRoundedRect(-180, 0, 360, 16, 4);
    this.bossContainer.add(frame);

    // Fill
    this.bossBarFill = this.add.graphics();
    this.bossContainer.add(this.bossBarFill);
  }

  updateHealthBar(current, max) {
    this.hpBar.clear();
    const pct = Math.max(0, current / max);
    const width = 158 * pct;
    this.hpBar.fillStyle(0xdc2626, 1);
    this.hpBar.fillRoundedRect(57, 29, width, 12, 2);
    if (this.hpText) this.hpText.setText(`${Math.ceil(current)} / ${max}`);
  }

  updateSoulBar(current, max) {
    this.soulBar.clear();
    const pct = Math.max(0, current / max);
    const width = 158 * pct;
    this.soulBar.fillStyle(0x06b6d4, 1);
    this.soulBar.fillRoundedRect(57, 49, width, 8, 2);
    if (this.soulText) this.soulText.setText(`SOUL: ${Math.ceil(current)} / ${max}`);
  }

  updateBossBar(current, max) {
    this.bossBarFill.clear();
    const pct = Math.max(0, current / max);
    const width = 356 * pct;

    // Phase 5: Dynamic phase colors
    // Phase 1 (100% - 66%): Void Purple (0x9333ea)
    // Phase 2 (66% - 33%): Aerial Tempest Cyan (0x0284c7)
    // Phase 3 (33% - 0%): Malakor Unbound Crimson (0xe11d48)
    let fillColor = 0x9333ea;
    if (pct <= 0.33) {
      fillColor = 0xe11d48;
    } else if (pct <= 0.66) {
      fillColor = 0x0284c7;
    }

    this.bossBarFill.fillStyle(fillColor, 1);
    this.bossBarFill.fillRoundedRect(-178, 2, width, 12, 2);
  }

  setupListeners() {
    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('health_changed', (cur, max) => {
      this.updateHealthBar(cur, max);
    });

    gameScene.events.on('soul_changed', (cur, max) => {
      this.updateSoulBar(cur, max);
    });

    gameScene.events.on('soul_depleted', () => {
      this.showToast('SOUL DEPLETED! Strike enemies with blade to regain soul.');
    });

    gameScene.events.on('shrine_rested', () => {
      this.showToast('BONFIRE KINDLED — HEALTH & SOUL RESTORED');
    });

    gameScene.events.on('boss_activated', (data) => {
      this.bossContainer.setVisible(true);
      this.bossTitle.setText(data.name);
      this.updateBossBar(data.health, data.maxHealth);
      this.showBanner('THE ABYSSAL KNIGHT AWAKENS');
    });

    gameScene.events.on('boss_health_changed', (cur, max) => {
      this.updateBossBar(cur, max);
    });

    gameScene.events.on('boss_defeated', () => {
      this.bossContainer.setVisible(false);
      this.showVictoryScreen();
    });

    gameScene.events.on('player_died', () => {
      this.showDeathScreen();
    });

    gameScene.events.on('ability_unlocked', (key, abilities) => {
      this.renderAbilityBar(abilities);
    });

    gameScene.events.on('ability_locked', (name, msg) => {
      this.showToast(`🔒 ${name.toUpperCase()} LOCKED — ${msg}`);
    });

    gameScene.events.on('show_toast', (msg) => {
      this.showToast(msg);
    });

    gameScene.events.on('sister_rescued', (data) => {
      this.showSisterReunionModal(data);
    });

    gameScene.events.on('open_campfire_haven', (data) => {
      this.showCampfireHavenModal(data);
    });

    gameScene.events.on('open_sister_banter', (data) => {
      this.showSisterBanterModal(data);
    });

    gameScene.events.on('lead_sister_swapped', (newSisterId, newSisterData) => {
      this.sisterId = newSisterId;
      this.sisterData = newSisterData;
      this.refreshHUDForLeadSister();
    });

    gameScene.events.on('player_moved', (data) => {
      if (data) this.updateMiniMap(data.x, data.y, data.biome);
    });

    gameScene.events.on('biome_discovered', (data) => {
      if (data) this.showBiomeBanner(data.name, data.subtitle, data.color);
    });

    gameScene.events.on('subregion_changed', (data) => {
      if (!data || !data.subRegion) return;
      const { subRegion, isFirstDiscovery } = data;
      this.updateSubRegionPill(subRegion);
      if (this.miniMapBiomeText) {
        this.miniMapBiomeText.setText(subRegion.name.toUpperCase());
      }
      if (isFirstDiscovery) {
        this.showSubRegionBanner(subRegion);
      }
    });

    gameScene.events.on('open_leyline_fast_travel', (data) => {
      this.showLeylineModal(data);
    });

    gameScene.events.on('input_type_changed', (type) => {
      this.activeInputType = type;
      this.renderAbilityBar();
      if (this.gamepadIcon) {
        this.gamepadIcon.setAlpha(type === 'gamepad' ? 1.0 : 0.35);
      }
    });

    gameScene.events.on('gamepad_status_changed', (info) => {
      if (info.connected) {
        this.showToast(`🎮 CONTROLLER CONNECTED: ${info.id.slice(0, 24)}`);
        if (this.gamepadIcon) this.gamepadIcon.setAlpha(1.0);
      } else {
        this.showToast('🎮 CONTROLLER DISCONNECTED');
        if (this.gamepadIcon) this.gamepadIcon.setAlpha(0.35);
      }
    });

    gameScene.events.on('toggle_pause', () => {
      this.toggleMenu();
    });

    gameScene.events.on('toggle_map', () => {
      this.toggleFullMap();
    });

    // Phase 6.5: Sigils & Keys HUD Refresh
    gameScene.events.on('sigil_collected', () => {
      this.updateSigilsHUD();
    });

    gameScene.events.on('key_collected', () => {
      this.updateSigilsHUD();
    });
  }

  showToast(message) {
    const toast = this.add.text(this.scale.width / 2, this.scale.height - 75, message, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#facc15',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: toast,
      y: toast.y - 20,
      alpha: 0,
      duration: 1800,
      delay: 1000,
      onComplete: () => toast.destroy(),
    });
  }

  showSisterReunionModal(data) {
    const { rescuedSister, rescuerSister, abilityInfo } = data;
    this.scene.pause('GameScene');

    const w = this.scale.width;
    const h = this.scale.height;

    const modal = this.add.container(0, 0);
    modal.setDepth(2000);

    // Full screen blocker backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x04030a, 0.92);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    modal.add(backdrop);

    const cardW = 560;
    const cardH = 340;
    const cx = w / 2;
    const cy = h / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0c0f1d, 0.98);
    panel.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(rescuedSister.themeColor).color, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    modal.add(panel);

    // Rescued Sister Portrait Frame
    const pBg = this.add.circle(cx - cardW / 2 + 75, cy - 50, 44, 0x1e1b4b);
    pBg.setStrokeStyle(2.5, Phaser.Display.Color.HexStringToColor(rescuedSister.themeColor).color);
    modal.add(pBg);

    const p = this.add.image(cx - cardW / 2 + 75, cy - 50, `${rescuedSister.id}_portrait`);
    p.setDisplaySize(80, 80);
    modal.add(p);

    // Header Title
    const title = this.add.text(cx, cy - cardH / 2 + 36, `SISTER REUNITED: ${rescuedSister.name.toUpperCase()}!`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: rescuedSister.themeColor,
      letterSpacing: 4,
      shadow: { color: rescuedSister.themeColor, blur: 14, fill: true },
    }).setOrigin(0.5);
    modal.add(title);

    // Heartfelt sister reunion dialogue
    const quotes = [
      `"You found me, ${rescuerSister.name}! I knew your light would pierce the abyss. Take my ${abilityInfo.name}—our souls are forever linked!"`,
      `"Sister! The void thought it could break us. Take my ${abilityInfo.name}—let our combined strength tear through Malakor's barrier!"`,
      `"I knew our bond would never waver! Wield my ${abilityInfo.name} alongside your own—we are invincible together!"`,
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    const dialogTxt = this.add.text(cx + 45, cy - 50, quote, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#f8fafc',
      wordWrap: { width: 350 },
      lineSpacing: 5,
    }).setOrigin(0.5);
    modal.add(dialogTxt);

    // Unlocked Ability Card Banner
    const abBanner = this.add.graphics();
    abBanner.fillStyle(0x18142b, 0.95);
    abBanner.lineStyle(1.5, 0xfacc15, 0.9);
    abBanner.fillRoundedRect(cx - 230, cy + 30, 460, 56, 8);
    abBanner.strokeRoundedRect(cx - 230, cy + 30, 460, 56, 8);
    modal.add(abBanner);

    const abTitle = this.add.text(cx, cy + 46, `✦ ABILITY BESTOWED: ${abilityInfo.name.toUpperCase()} ✦`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 2,
    }).setOrigin(0.5);
    modal.add(abTitle);

    const abDesc = this.add.text(cx, cy + 68, `Press [ ${abilityInfo.hotkey} ] — ${abilityInfo.desc}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
    modal.add(abDesc);

    // Continue Button
    const btnW = 200;
    const btnH = 34;
    const btn = this.add.container(cx, cy + cardH / 2 - 38);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7c3aed, 1);
    btnBg.lineStyle(1.5, 0xc084fc, 1);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    btn.add(btnBg);

    const btnTxt = this.add.text(0, 0, 'CONTINUE QUEST', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12.5px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    btn.add(btnTxt);

    btn.setSize(btnW, btnH);
    btn.setInteractive(new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    const setBtnHover = (hover) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0x9333ea : 0x7c3aed, 1);
      btnBg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : 0xc084fc, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      btnTxt.setScale(hover ? 1.05 : 1.0);
    };

    btn.on('pointerover', () => setBtnHover(true));
    btn.on('pointerout', () => setBtnHover(false));

    const finishReunion = () => {
      soundFX.playCollect();
      this.clearModalFocus('sister_reunion');
      modal.destroy();
      this.scene.resume('GameScene');
      this.renderAbilityBar();
    };

    btn.on('pointerdown', () => finishReunion());
    modal.add(btn);

    const hint = this.add.text(cx, cy + cardH / 2 - 12, '🎮 Press [A] or [B] or Space to Continue', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10.5px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(hint);

    this.setModalFocus({
      id: 'sister_reunion',
      items: [{
        container: btn,
        setHover: setBtnHover,
        clickFn: finishReunion,
      }],
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: finishReunion,
    });
  }

  showBanner(message) {
    const banner = this.add.text(this.scale.width / 2, 120, message, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ec4899',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1.1,
      duration: 600,
      yoyo: true,
      hold: 1400,
      onComplete: () => banner.destroy(),
    });
  }

  showDeathScreen() {
    const text = this.add.text(this.scale.width / 2, this.scale.height / 2, 'YOU HAVE FALLEN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '36px',
      color: '#b91c1c',
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 800,
      yoyo: true,
      hold: 1000,
      onComplete: () => text.destroy(),
    });
  }

  showVictoryScreen() {
    this.scene.pause('GameScene');

    const w = this.scale.width;
    const h = this.scale.height;

    const modal = this.add.container(0, 0).setDepth(3000);

    // Full screen deep night backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x020308, 0.94);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    modal.add(backdrop);

    const cardW = 720;
    const cardH = 490;
    const cx = w / 2;
    const cy = h / 2;

    // Golden filigree frame
    const panel = this.add.graphics();
    panel.fillStyle(0x080a14, 0.98);
    panel.lineStyle(2.5, 0xf59e0b, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    modal.add(panel);

    // Grand Triumphant Header
    const title = this.add.text(cx, cy - cardH / 2 + 30, '✦ THE SISTERS TRIUMPHANT: ABYSSAL BLADE ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 3,
      shadow: { color: '#f59e0b', blur: 14, fill: true },
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.add.text(cx, cy - cardH / 2 + 56, 'The Four Sisters of the Sunken Keep are United • Malakor is Banished • The Abyss is Sealed', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
    modal.add(subtitle);

    // Four Sisters Reunited Showcase
    const sisters = [
      {
        id: 'wren',
        name: 'Wren',
        title: 'The Zephyr Swift',
        color: '#10b981',
        quote: '"The storm winds are quiet at last. Our blades soar free across the sky!"',
      },
      {
        id: 'percy',
        name: 'Percy',
        title: 'The Iron Resolute',
        color: '#f59e0b',
        quote: '"Our shield wall held unbroken. The keep is defended for all eternity!"',
      },
      {
        id: 'mona',
        name: 'Mona',
        title: 'The Mystic Astral',
        color: '#c084fc',
        quote: '"The cosmic veil clears. True starlight shines upon our family once more."',
      },
      {
        id: 'tilly',
        name: 'Tilly',
        title: 'The Wildheart Scout',
        color: '#ef4444',
        quote: '"We did it! Hand in hand, the four sisters are together forever!"',
      },
    ];

    const cardWidth = 158;
    const startX = cx - (4 * cardWidth + 3 * 10) / 2 + cardWidth / 2;

    sisters.forEach((s, idx) => {
      const sx = startX + idx * (cardWidth + 10);
      const sy = cy + 10;

      const card = this.add.container(sx, sy);
      const cbg = this.add.graphics();
      cbg.fillStyle(0x0e1322, 0.95);
      cbg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(s.color).color, 0.9);
      cbg.fillRoundedRect(-cardWidth / 2, -120, cardWidth, 240, 8);
      cbg.strokeRoundedRect(-cardWidth / 2, -120, cardWidth, 240, 8);
      card.add(cbg);

      // Portrait
      const port = this.add.image(0, -70, `${s.id}_portrait`);
      port.setDisplaySize(66, 66);
      card.add(port);

      // Name & Title
      const sName = this.add.text(0, -25, s.name.toUpperCase(), {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: s.color,
        letterSpacing: 1.5,
      }).setOrigin(0.5);
      card.add(sName);

      const sTitle = this.add.text(0, -9, s.title, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9.5px',
        color: '#94a3b8',
      }).setOrigin(0.5);
      card.add(sTitle);

      // Heartfelt Ending Quote
      const sQuote = this.add.text(0, 45, s.quote, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '10.5px',
        color: '#f8fafc',
        align: 'center',
        wordWrap: { width: cardWidth - 18 },
        lineSpacing: 3,
      }).setOrigin(0.5);
      card.add(sQuote);

      modal.add(card);
    });

    // Campaign Accomplishment Trophies Bar
    const trophyBar = this.add.text(cx, cy + 155, '🏆 ALL 4 SISTER ABILITIES UNITED   •   ⭐ 4 ANCIENT KEEPSAKES RECOVERED   •   ⚔️ MALAKOR UNBOUND SLAIN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    modal.add(trophyBar);

    // Interactive Action Buttons
    // 1. Replay Run
    const replayBtn = this.add.container(cx - 130, cy + cardH / 2 - 40);
    const rbg = this.add.graphics();
    rbg.fillStyle(0x1e1b4b, 1);
    rbg.lineStyle(1.5, 0xa855f7, 1);
    rbg.fillRoundedRect(-100, -16, 200, 32, 6);
    rbg.strokeRoundedRect(-100, -16, 200, 32, 6);
    replayBtn.add(rbg);

    const rtxt = this.add.text(0, 0, '🔄 PLAY AGAIN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    replayBtn.add(rtxt);

    replayBtn.setSize(200, 32);
    replayBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -16, 200, 32), Phaser.Geom.Rectangle.Contains);

    const setReplayHover = (hover) => {
      rbg.clear();
      rbg.fillStyle(hover ? 0x312e81 : 0x1e1b4b, 1);
      rbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : 0xa855f7, 1);
      rbg.fillRoundedRect(-100, -16, 200, 32, 6);
      rbg.strokeRoundedRect(-100, -16, 200, 32, 6);
      rtxt.setScale(hover ? 1.05 : 1.0);
    };

    const clickReplay = () => {
      this.clearModalFocus('victory_screen');
      this.scene.stop('UIScene');
      this.scene.get('GameScene').scene.restart();
      this.scene.restart();
    };

    replayBtn.on('pointerover', () => {
      if (this.currentModalFocus && this.currentModalFocus.id === 'victory_screen') {
        if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
          this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
        }
        this.currentModalFocus.selectedIndex = 0;
      }
      setReplayHover(true);
    });
    replayBtn.on('pointerout', () => {
      if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== 0) setReplayHover(false);
    });
    replayBtn.on('pointerdown', clickReplay);
    modal.add(replayBtn);

    // 2. Return to Haven (Explore freely)
    const havenBtn = this.add.container(cx + 130, cy + cardH / 2 - 40);
    const hbg = this.add.graphics();
    hbg.fillStyle(0x064e3b, 1);
    hbg.lineStyle(1.5, 0x10b981, 1);
    hbg.fillRoundedRect(-110, -16, 220, 32, 6);
    hbg.strokeRoundedRect(-110, -16, 220, 32, 6);
    havenBtn.add(hbg);

    const htxt = this.add.text(0, 0, '🏕️ RETURN TO HAVEN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    havenBtn.add(htxt);

    havenBtn.setSize(220, 32);
    havenBtn.setInteractive(new Phaser.Geom.Rectangle(-110, -16, 220, 32), Phaser.Geom.Rectangle.Contains);

    const setHavenHover = (hover) => {
      hbg.clear();
      hbg.fillStyle(hover ? 0x059669 : 0x064e3b, 1);
      hbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : 0x10b981, 1);
      hbg.fillRoundedRect(-110, -16, 220, 32, 6);
      hbg.strokeRoundedRect(-110, -16, 220, 32, 6);
      htxt.setScale(hover ? 1.05 : 1.0);
    };

    const clickHaven = () => {
      this.clearModalFocus('victory_screen');
      modal.destroy();
      this.scene.resume('GameScene');
      const gs = this.scene.get('GameScene');
      if (gs && gs.player) {
        gs.player.setPosition(800, 1580);
      }
    };

    havenBtn.on('pointerover', () => {
      if (this.currentModalFocus && this.currentModalFocus.id === 'victory_screen') {
        if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
          this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
        }
        this.currentModalFocus.selectedIndex = 1;
      }
      setHavenHover(true);
    });
    havenBtn.on('pointerout', () => {
      if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== 1) setHavenHover(false);
    });
    havenBtn.on('pointerdown', clickHaven);
    modal.add(havenBtn);

    // Controller navigation prompt at bottom
    const vHint = this.add.text(cx, cy + cardH / 2 - 14, '🎮 [D-Pad / Stick] Navigate  •  [A] Select  •  [B] Return to Haven', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(vHint);

    this.setModalFocus({
      id: 'victory_screen',
      items: [
        { container: replayBtn, setHover: setReplayHover, clickFn: clickReplay },
        { container: havenBtn, setHover: setHavenHover, clickFn: clickHaven },
      ],
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: clickHaven,
    });
  }

  createTouchControls() {
    // Only display touch buttons if on touch device / viewport
    if (!('ontouchstart' in window) && navigator.maxTouchPoints <= 0) return;

    const w = this.scale.width;
    const h = this.scale.height;

    // Left D-Pad
    const leftBtn = this.add.circle(60, h - 90, 32, 0x334155, 0.6).setInteractive();
    this.add.text(60, h - 90, '◀', { fontSize: '20px' }).setOrigin(0.5);

    const rightBtn = this.add.circle(135, h - 90, 32, 0x334155, 0.6).setInteractive();
    this.add.text(135, h - 90, '▶', { fontSize: '20px' }).setOrigin(0.5);

    // Right Action Buttons
    const jumpBtn = this.add.circle(w - 70, h - 130, 32, 0x2563eb, 0.7).setInteractive();
    this.add.text(w - 70, h - 130, 'JUMP', { fontSize: '11px', fontFamily: 'Outfit' }).setOrigin(0.5);

    const atkBtn = this.add.circle(w - 140, h - 80, 34, 0xdc2626, 0.7).setInteractive();
    this.add.text(w - 140, h - 80, 'ATK', { fontSize: '12px', fontFamily: 'Outfit' }).setOrigin(0.5);

    const castBtn = this.add.circle(w - 70, h - 60, 32, 0x9333ea, 0.7).setInteractive();
    this.add.text(w - 70, h - 60, 'SPELL', { fontSize: '10px', fontFamily: 'Outfit' }).setOrigin(0.5);

    const gameScene = this.scene.get('GameScene');

    leftBtn.on('pointerdown', () => (gameScene.touchControls.left = true));
    leftBtn.on('pointerup', () => (gameScene.touchControls.left = false));
    leftBtn.on('pointerout', () => (gameScene.touchControls.left = false));

    rightBtn.on('pointerdown', () => (gameScene.touchControls.right = true));
    rightBtn.on('pointerup', () => (gameScene.touchControls.right = false));
    rightBtn.on('pointerout', () => (gameScene.touchControls.right = false));

    jumpBtn.on('pointerdown', () => {
      if (gameScene.player) {
        if (gameScene.player.body.blocked.down || gameScene.player.isWallSliding || gameScene.player.canDoubleJump) {
          gameScene.player.body.setVelocityY(gameScene.player.jumpForce);
        }
      }
    });

    atkBtn.on('pointerdown', () => {
      if (gameScene.player) gameScene.player.performAttack();
    });

    castBtn.on('pointerdown', () => {
      if (gameScene.player) gameScene.player.castSoulBolt();
    });
  }

  // --- PHASE 3: HUD MINI-MAP SYSTEM ---
  createMiniMap() {
    const w = this.scale.width;
    const mapW = 164;
    const mapH = 92;
    const x = w - mapW - 24;
    const y = 68;

    this.miniMapContainer = this.add.container(x, y);

    // Dark gothic plaque background
    const bg = this.add.graphics();
    bg.fillStyle(0x07090e, 0.88);
    bg.lineStyle(1.5, 0x334155, 0.9);
    bg.fillRoundedRect(0, 0, mapW, mapH, 6);
    bg.strokeRoundedRect(0, 0, mapW, mapH, 6);
    this.miniMapContainer.add(bg);

    // Top gold filigree line
    const trim = this.add.graphics();
    trim.fillStyle(0xd97706, 0.8);
    trim.fillRect(8, 20, mapW - 16, 1);
    this.miniMapContainer.add(trim);

    // Current Biome Label
    this.miniMapBiomeText = this.add.text(mapW / 2, 10, 'WHISPERING CATACOMBS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '8.5px',
      fontStyle: 'bold',
      color: '#e2e8f0',
      letterSpacing: 1.2,
    }).setOrigin(0.5);
    this.miniMapContainer.add(this.miniMapBiomeText);

    // Interactive button to open full map
    const mapBtn = this.add.text(mapW - 10, 10, '⛶ [M]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '8px',
      color: '#94a3b8',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    mapBtn.on('pointerdown', () => this.toggleFullMap());
    this.miniMapContainer.add(mapBtn);

    // Map graphics drawing layer
    this.miniMapGfx = this.add.graphics();
    this.miniMapContainer.add(this.miniMapGfx);

    // Player blip sprite
    this.playerBlip = this.add.circle(0, 0, 3, 0x22d3ee);
    this.miniMapContainer.add(this.playerBlip);

    // Initial render
    this.updateMiniMap(200, 1500, 'catacombs');
  }

  updateMiniMap(playerX, playerY, biome) {
    if (!this.miniMapGfx) return;

    // Biome label updates
    const biomeNames = {
      catacombs: 'WHISPERING CATACOMBS',
      grotto: 'CRYSTAL GROTTO',
      foundry: 'MOLTEN FOUNDRY',
      spire: 'HOWLING SPIRE',
      sanctum: 'SANCTUM OF THE VOID',
    };
    if (biome && biomeNames[biome]) {
      this.miniMapBiomeText.setText(biomeNames[biome]);
    }

    // World size 5400 x 2200 mapped onto 14 x 6 grid
    const totalCols = 14;
    const totalRows = 6;
    const colW = 5400 / totalCols;
    const rowH = 2200 / totalRows;

    const curCol = Phaser.Math.Clamp(Math.floor(playerX / colW), 0, totalCols - 1);
    const curRow = Phaser.Math.Clamp(Math.floor(playerY / rowH), 0, totalRows - 1);

    // Discover current & adjacent cells
    for (let c = Math.max(0, curCol - 1); c <= Math.min(totalCols - 1, curCol + 1); c++) {
      for (let r = Math.max(0, curRow - 1); r <= Math.min(totalRows - 1, curRow + 1); r++) {
        this.discoveredCells.add(`${c},${r}`);
      }
    }

    // Render cells on Mini-Map
    this.miniMapGfx.clear();
    const startX = 12;
    const startY = 26;
    const cellW = 10;
    const cellH = 9.5;

    // Biome cell colors
    const getCellColor = (c, r) => {
      if (c >= 11 && r >= 3) return 0x9333ea; // Sanctum
      if (r <= 2 && c <= 5) return 0x0891b2;  // Crystal Grotto
      if (r <= 2 && c > 5) return 0x4f46e5;   // Howling Spire
      if (r >= 4 && c >= 3) return 0xc2410c;  // Molten Foundry
      return 0x334155; // Catacombs
    };

    // Draw grid background outlines
    this.miniMapGfx.lineStyle(1, 0x1e293b, 0.4);
    for (let c = 0; c < totalCols; c++) {
      for (let r = 0; r < totalRows; r++) {
        this.miniMapGfx.strokeRect(startX + c * cellW, startY + r * cellH, cellW, cellH);
      }
    }

    // Draw discovered cells
    this.discoveredCells.forEach((key) => {
      const [c, r] = key.split(',').map(Number);
      const col = getCellColor(c, r);
      this.miniMapGfx.fillStyle(col, 0.7);
      this.miniMapGfx.fillRect(startX + c * cellW + 1, startY + r * cellH + 1, cellW - 1, cellH - 1);
    });

    // Draw landmarks
    // Sister Chambers: Grotto (4, 1), Foundry (9, 5), Spire (10, 1)
    const sisterChambers = [
      { c: 4, r: 1 },
      { c: 9, r: 5 },
      { c: 10, r: 1 },
    ];
    sisterChambers.forEach((sc) => {
      if (this.discoveredCells.has(`${sc.c},${sc.r}`)) {
        this.miniMapGfx.fillStyle(0xfbbf24, 1);
        this.miniMapGfx.fillCircle(startX + sc.c * cellW + cellW / 2, startY + sc.r * cellH + cellH / 2, 2.5);
      }
    });

    // Sanctum Gate / Boss: (11, 4)
    if (this.discoveredCells.has('11,4')) {
      this.miniMapGfx.fillStyle(0xef4444, 1);
      this.miniMapGfx.fillCircle(startX + 11 * cellW + cellW / 2, startY + 4 * cellH + cellH / 2, 3);
    }

    // Position player blip
    const blipX = startX + (playerX / 5400) * (totalCols * cellW);
    const blipY = startY + (playerY / 2200) * (totalRows * cellH);
    this.playerBlip.setPosition(blipX, blipY);
  }

  // --- BIOME ARRIVAL CINEMATIC BANNER ---
  createBiomeBanner() {
    const cx = this.scale.width / 2;
    this.biomeBanner = this.add.container(cx, 130);
    this.biomeBanner.setAlpha(0);
    this.biomeBanner.setVisible(false);

    // Dark gothic translucent ribbon
    const ribbon = this.add.graphics();
    ribbon.fillStyle(0x090b14, 0.92);
    ribbon.lineStyle(2, 0xd97706, 0.95);
    ribbon.fillRoundedRect(-240, -32, 480, 64, 8);
    ribbon.strokeRoundedRect(-240, -32, 480, 64, 8);
    this.biomeBanner.add(ribbon);

    // Decorative stars
    this.bannerStars = this.add.text(0, -20, '✦  ━━━━━━━━━━━━━━  ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10px',
      color: '#d97706',
    }).setOrigin(0.5);
    this.biomeBanner.add(this.bannerStars);

    // Biome Title
    this.bannerTitle = this.add.text(0, -4, '', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 4,
    }).setOrigin(0.5);
    this.biomeBanner.add(this.bannerTitle);

    // Biome Subtitle
    this.bannerSubtitle = this.add.text(0, 16, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.biomeBanner.add(this.bannerSubtitle);
  }

  showBiomeBanner(name, subtitle, color = '#22d3ee') {
    if (!this.biomeBanner) return;

    this.bannerTitle.setText(name.toUpperCase());
    this.bannerTitle.setColor(color);
    this.bannerSubtitle.setText(subtitle);

    this.biomeBanner.setVisible(true);
    this.biomeBanner.setAlpha(0);
    this.biomeBanner.y = 100;

    soundFX.playBiomeFanfare();

    this.tweens.killTweensOf(this.biomeBanner);
    this.tweens.add({
      targets: this.biomeBanner,
      alpha: 1,
      y: 130,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: this.biomeBanner,
            alpha: 0,
            y: 90,
            duration: 500,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              this.biomeBanner.setVisible(false);
            },
          });
        });
      },
    });
  }

  // --- PHASE 8: SUB-REGION HUD SIGNIFIER PILL & BANNER ---
  createSubRegionPill() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.subRegionPillContainer = this.add.container(w - 20, h - 22);
    this.subRegionPillContainer.setDepth(150);

    const pillW = 320;
    const pillH = 26;

    const pillBg = this.add.graphics();
    pillBg.fillStyle(0x07090e, 0.9);
    pillBg.lineStyle(1.5, 0x38bdf8, 0.85);
    pillBg.fillRoundedRect(-pillW, -pillH / 2, pillW, pillH, 6);
    pillBg.strokeRoundedRect(-pillW, -pillH / 2, pillW, pillH, 6);
    this.subRegionPillContainer.add(pillBg);
    this.subRegionPillBg = pillBg;

    this.subRegionPillText = this.add.text(-pillW / 2, 0, '📍 Sanctuary of Haven [catacombs_haven]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 0.5,
    }).setOrigin(0.5);
    this.subRegionPillContainer.add(this.subRegionPillText);
  }

  updateSubRegionPill(subRegion) {
    if (!this.subRegionPillText || !subRegion) return;
    this.subRegionPillText.setText(`📍 ${subRegion.name} [${subRegion.id}]`);
    this.subRegionPillText.setColor(subRegion.themeColor || '#ffffff');

    if (this.subRegionPillBg) {
      const pillW = 320;
      const pillH = 26;
      this.subRegionPillBg.clear();
      this.subRegionPillBg.fillStyle(0x07090e, 0.9);
      this.subRegionPillBg.lineStyle(1.5, subRegion.colorHex || 0x38bdf8, 0.85);
      this.subRegionPillBg.fillRoundedRect(-pillW, -pillH / 2, pillW, pillH, 6);
      this.subRegionPillBg.strokeRoundedRect(-pillW, -pillH / 2, pillW, pillH, 6);
    }
  }

  showSubRegionBanner(subRegion) {
    if (!this.biomeBanner) return;

    this.bannerStars.setText(`✦  ${subRegion.parentName.toUpperCase()}  ✦`);
    this.bannerStars.setColor(subRegion.themeColor || '#fbbf24');
    this.bannerTitle.setText(`${subRegion.name.toUpperCase()} [${subRegion.id}]`);
    this.bannerTitle.setColor(subRegion.themeColor || '#ffffff');
    this.bannerSubtitle.setText(subRegion.subtitle || subRegion.lore);

    this.biomeBanner.setVisible(true);
    this.biomeBanner.setAlpha(0);
    this.biomeBanner.y = 100;

    soundFX.playBiomeFanfare();

    this.tweens.killTweensOf(this.biomeBanner);
    this.tweens.add({
      targets: this.biomeBanner,
      alpha: 1,
      y: 130,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2400, () => {
          this.tweens.add({
            targets: this.biomeBanner,
            alpha: 0,
            y: 90,
            duration: 500,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              this.biomeBanner.setVisible(false);
            },
          });
        });
      },
    });
  }

  // --- PHASE 8: ASTRAL LEYLINE FAST-TRAVEL MODAL ---
  createLeylineModal() {
    this.leylineModal = this.add.container(0, 0);
    this.leylineModal.setDepth(2100);
    this.leylineModal.setVisible(false);
  }

  showLeylineModal(data) {
    this.leylineModal.removeAll(true);
    this.scene.pause('GameScene');

    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2;

    // Full screen backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x030408, 0.92);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    this.leylineModal.add(backdrop);

    const cardW = 580;
    const cardH = 390;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0d1b, 0.98);
    panel.lineStyle(2, 0x38bdf8, 0.9);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    this.leylineModal.add(panel);

    // Header Title
    const title = this.add.text(cx, cy - cardH / 2 + 30, '✨ ASTRAL LEYLINE NETWORK', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 4,
      shadow: { color: '#38bdf8', blur: 12, fill: true },
    }).setOrigin(0.5);
    this.leylineModal.add(title);

    const subtitle = this.add.text(cx, cy - cardH / 2 + 56, 'Channel the starlight leylines to manifest across the sunless depths', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    this.leylineModal.add(subtitle);

    const closeLeyline = () => {
      this.clearModalFocus('leyline_modal');
      this.leylineModal.setVisible(false);
      this.scene.resume('GameScene');
    };

    const modalButtons = [];
    const leylines = data.allLeylines || [];
    const discoveredIds = new Set(data.discoveredIds || []);

    const startY = cy - 80;
    const itemGap = 52;
    const itemW = 500;
    const itemH = 42;

    leylines.forEach((ley, idx) => {
      const isDiscovered = discoveredIds.has(ley.id);
      const ly = startY + idx * itemGap;
      const itemContainer = this.add.container(cx, ly);

      const iBg = this.add.graphics();
      const col = isDiscovered ? Phaser.Display.Color.HexStringToColor(ley.color).color : 0x1e293b;
      iBg.fillStyle(0x0f172a, 0.95);
      iBg.lineStyle(1.5, col, isDiscovered ? 0.8 : 0.3);
      iBg.fillRoundedRect(-itemW / 2, -itemH / 2, itemW, itemH, 6);
      iBg.strokeRoundedRect(-itemW / 2, -itemH / 2, itemW, itemH, 6);
      itemContainer.add(iBg);

      const labelTxt = isDiscovered 
        ? `${ley.name} [${ley.subRegionId}]` 
        : `🔒 Undiscovered Astral Waypoint [${ley.id}]`;
      const iTxt = this.add.text(-itemW / 2 + 20, 0, labelTxt, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: isDiscovered ? '#f8fafc' : '#64748b',
        letterSpacing: 1,
      }).setOrigin(0, 0.5);
      itemContainer.add(iTxt);

      if (isDiscovered) {
        const warpBadge = this.add.text(itemW / 2 - 20, 0, '⚡ WARP', {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: ley.color,
        }).setOrigin(1, 0.5);
        itemContainer.add(warpBadge);

        itemContainer.setSize(itemW, itemH);
        itemContainer.setInteractive(new Phaser.Geom.Rectangle(-itemW / 2, -itemH / 2, itemW, itemH), Phaser.Geom.Rectangle.Contains);

        const setHover = (hover) => {
          iBg.clear();
          iBg.fillStyle(hover ? 0x1e293b : 0x0f172a, 1);
          iBg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : col, 1);
          iBg.fillRoundedRect(-itemW / 2, -itemH / 2, itemW, itemH, 6);
          iBg.strokeRoundedRect(-itemW / 2, -itemH / 2, itemW, itemH, 6);
          iTxt.setScale(hover ? 1.03 : 1.0);
        };

        const clickFn = () => {
          closeLeyline();
          const gs = this.scene.get('GameScene');
          if (gs) {
            gs.events.emit('teleport_to_leyline', ley.id);
          }
        };

        itemContainer.on('pointerover', () => {
          if (this.currentModalFocus && this.currentModalFocus.id === 'leyline_modal') {
            this.currentModalFocus.selectedIndex = modalButtons.length;
          }
          setHover(true);
        });
        itemContainer.on('pointerout', () => setHover(false));
        itemContainer.on('pointerdown', clickFn);

        modalButtons.push({ container: itemContainer, setHover, clickFn });
      }

      this.leylineModal.add(itemContainer);
    });

    // Close button at bottom
    const closeBtnW = 160;
    const closeBtnH = 32;
    const closeBtn = this.add.container(cx, cy + cardH / 2 - 32);
    const cBg = this.add.graphics();
    cBg.fillStyle(0x1f2937, 1);
    cBg.lineStyle(1.5, 0x4b5563, 1);
    cBg.fillRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 6);
    cBg.strokeRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 6);
    closeBtn.add(cBg);

    const cTxt = this.add.text(0, 0, '✖ CANCEL', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    closeBtn.add(cTxt);

    closeBtn.setSize(closeBtnW, closeBtnH);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH), Phaser.Geom.Rectangle.Contains);

    const setCloseHover = (hover) => {
      cBg.clear();
      cBg.fillStyle(hover ? 0x374151 : 0x1f2937, 1);
      cBg.lineStyle(hover ? 2 : 1.5, hover ? 0xffffff : 0x4b5563, 1);
      cBg.fillRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 6);
      cBg.strokeRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 6);
    };

    closeBtn.on('pointerover', () => setCloseHover(true));
    closeBtn.on('pointerout', () => setCloseHover(false));
    closeBtn.on('pointerdown', closeLeyline);
    this.leylineModal.add(closeBtn);

    modalButtons.push({ container: closeBtn, setHover: setCloseHover, clickFn: closeLeyline });

    this.leylineModal.setVisible(true);

    this.setModalFocus({
      id: 'leyline_modal',
      items: modalButtons,
      selectedIndex: 0,
      orientation: 'vertical',
      onCancel: closeLeyline,
    });
  }

  // --- FULL-SCREEN ANCIENT CARTOGRAPHER'S MAP MODAL ---
  createFullMapModal() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.fullMapModal = this.add.container(0, 0);
    this.fullMapModal.setVisible(false);

    // Dark backdrop
    const darkBackdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x030408, 0.92);
    darkBackdrop.setInteractive();
    this.fullMapModal.add(darkBackdrop);

    // Ancient Map Parchment Frame
    const frameW = Math.min(840, w - 80);
    const frameH = Math.min(540, h - 80);
    const cx = w / 2;
    const cy = h / 2;

    const frame = this.add.graphics();
    frame.fillStyle(0x0c0f1d, 0.96);
    frame.lineStyle(2.5, 0xd97706, 0.95);
    frame.fillRoundedRect(cx - frameW / 2, cy - frameH / 2, frameW, frameH, 12);
    frame.strokeRoundedRect(cx - frameW / 2, cy - frameH / 2, frameW, frameH, 12);
    this.fullMapModal.add(frame);

    // Title & Header
    const title = this.add.text(cx, cy - frameH / 2 + 28, '🗺️ REALMS OF THE SUNKEN KEEP', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f8fafc',
      letterSpacing: 4,
    }).setOrigin(0.5);
    this.fullMapModal.add(title);

    // Exploration Stat
    this.explorationStatText = this.add.text(cx, cy - frameH / 2 + 50, 'EXPLORATION: 0%', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#d97706',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.fullMapModal.add(this.explorationStatText);

    // Large Map Grid Graphics
    this.fullMapGfx = this.add.graphics();
    this.fullMapModal.add(this.fullMapGfx);

    // Legend at bottom
    const legendItems = [
      { col: '#0891b2', name: 'Crystal Grotto' },
      { col: '#4f46e5', name: 'Howling Spire' },
      { col: '#475569', name: 'Catacombs' },
      { col: '#c2410c', name: 'Molten Foundry' },
      { col: '#9333ea', name: 'Void Sanctum' },
      { col: '#fbbf24', name: '★ Sister Chamber' },
    ];
    const legendContainer = this.add.container(cx, cy + frameH / 2 - 35);
    legendItems.forEach((item, i) => {
      const lx = (i - 2.5) * 115;
      const dot = this.add.circle(lx - 6, 0, 4, Phaser.Display.Color.HexStringToColor(item.col).color);
      const lbl = this.add.text(lx + 4, 0, item.name, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '10px',
        color: '#cbd5e1',
      }).setOrigin(0, 0.5);
      legendContainer.add([dot, lbl]);
    });
    this.fullMapModal.add(legendContainer);

    // Close Button [M or ESC]
    const closeBtn = this.add.text(cx, cy + frameH / 2 - 70, '[PRESS M OR ESC TO RETURN]', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#94a3b8',
      letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleFullMap());
    this.fullMapModal.add(closeBtn);
  }

  renderFullMap() {
    if (!this.fullMapGfx) return;
    this.fullMapGfx.clear();

    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const cy = h / 2 - 10;

    const totalCols = 14;
    const totalRows = 6;
    const cellW = 44;
    const cellH = 40;
    const mapTotalW = totalCols * cellW;
    const mapTotalH = totalRows * cellH;
    const startX = cx - mapTotalW / 2;
    const startY = cy - mapTotalH / 2;

    const totalCells = totalCols * totalRows;
    const pct = Math.round((this.discoveredCells.size / totalCells) * 100);
    this.explorationStatText.setText(`KEEP EXPLORATION: ${pct}% DISCOVERED (${this.discoveredCells.size}/${totalCells} SECTORS)`);

    const getCellColor = (c, r) => {
      if (c >= 11 && r >= 3) return 0x9333ea; // Sanctum
      if (r <= 2 && c <= 5) return 0x0891b2;  // Crystal Grotto
      if (r <= 2 && c > 5) return 0x4f46e5;   // Howling Spire
      if (r >= 4 && c >= 3) return 0xc2410c;  // Molten Foundry
      return 0x334155; // Catacombs
    };

    // Draw Grid Cells
    for (let c = 0; c < totalCols; c++) {
      for (let r = 0; r < totalRows; r++) {
        const x = startX + c * cellW;
        const y = startY + r * cellH;

        if (this.discoveredCells.has(`${c},${r}`)) {
          const col = getCellColor(c, r);
          this.fullMapGfx.fillStyle(col, 0.75);
          this.fullMapGfx.fillRoundedRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
          this.fullMapGfx.lineStyle(1.5, col, 0.95);
          this.fullMapGfx.strokeRoundedRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
        } else {
          // Fog of war
          this.fullMapGfx.fillStyle(0x05070f, 0.85);
          this.fullMapGfx.fillRoundedRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
          this.fullMapGfx.lineStyle(1, 0x1e293b, 0.4);
          this.fullMapGfx.strokeRoundedRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
        }
      }
    }

    // Sister Chambers
    const sisterChambers = [
      { c: 4, r: 1, name: 'Mona' },
      { c: 9, r: 5, name: 'Percy' },
      { c: 10, r: 1, name: 'Tilly/Wren' },
    ];
    sisterChambers.forEach((sc) => {
      if (this.discoveredCells.has(`${sc.c},${sc.r}`)) {
        const x = startX + sc.c * cellW + cellW / 2;
        const y = startY + sc.r * cellH + cellH / 2;
        this.fullMapGfx.fillStyle(0xfbbf24, 1);
        this.fullMapGfx.fillCircle(x, y, 7);
      }
    });

    // Player position
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.player) {
      const px = startX + (gameScene.player.x / 5400) * mapTotalW;
      const py = startY + (gameScene.player.y / 2200) * mapTotalH;
      this.fullMapGfx.fillStyle(0x22d3ee, 1);
      this.fullMapGfx.fillCircle(px, py, 6);
      this.fullMapGfx.lineStyle(2, 0xffffff, 1);
      this.fullMapGfx.strokeCircle(px, py, 8);
    }
  }

  toggleFullMap() {
    if (this.isFullMapOpen) {
      this.closeFullMap();
    } else {
      this.openFullMap();
    }
  }

  openFullMap() {
    this.isFullMapOpen = true;
    this.renderFullMap();
    this.fullMapModal.setVisible(true);
    soundFX.playCollect();
    this.scene.pause('GameScene');
    this.setModalFocus({
      id: 'full_map',
      items: [],
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: () => this.closeFullMap(),
    });
  }

  closeFullMap() {
    this.isFullMapOpen = false;
    this.fullMapModal.setVisible(false);
    this.clearModalFocus('full_map');
    this.scene.resume('GameScene');
  }

  // --- PHASE 4: REFRESH HUD ON SISTER SWAP ---
  refreshHUDForLeadSister() {
    if (!this.hudBg) return;
    this.hudBg.clear();
    this.hudBg.fillStyle(0x0b0d14, 0.85);
    this.hudBg.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.sisterData.themeColor).color, 0.9);
    this.hudBg.fillRoundedRect(0, 0, 260, 80, 8);
    this.hudBg.strokeRoundedRect(0, 0, 260, 80, 8);

    this.hudCrest.clear();
    this.hudCrest.fillStyle(0x1e1b4b, 1);
    this.hudCrest.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.sisterData.accentColor).color, 1);
    this.hudCrest.fillCircle(28, 40, 20);
    this.hudCrest.strokeCircle(28, 40, 20);

    this.hudPortrait.setTexture(`${this.sisterId}_portrait`);

    this.hudTitle.setText(`${this.sisterData.name.toUpperCase()} — ${this.sisterData.title}`);
    this.hudTitle.setColor(this.sisterData.themeColor);

    this.renderAbilityBar();
  }

  // --- PHASE 4: CAMPFIRE HAVEN MODAL ---
  showCampfireHavenModal(data) {
    const gameScene = this.scene.get('GameScene');
    this.scene.pause('GameScene');

    const w = this.scale.width;
    const h = this.scale.height;

    const modal = this.add.container(0, 0).setDepth(2500);

    // Blocker Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x03040a, 0.92);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    modal.add(backdrop);

    const cardW = 620;
    const cardH = 460;
    const cx = w / 2;
    const cy = h / 2;

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0c0d18, 0.98);
    panel.lineStyle(2.5, 0xf59e0b, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    modal.add(panel);

    // Header Title
    const title = this.add.text(cx, cy - cardH / 2 + 32, '🔥 THE SISTERS\' HAVEN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 3,
      shadow: { color: '#f59e0b', blur: 12, fill: true },
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.add.text(cx, cy - cardH / 2 + 58, 'Sanctuary Bonfire • Whispering Catacombs Hub', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(subtitle);

    // Active Lead Sister Summary Row
    const leadBanner = this.add.text(cx, cy - cardH / 2 + 86, `CURRENT VANGUARD: ${this.sisterData.name.toUpperCase()} (${this.sisterData.title})`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: this.sisterData.themeColor,
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    modal.add(leadBanner);

    // Keepsakes Section Header
    const keepLabel = this.add.text(cx - cardW / 2 + 30, cy - 105, 'ANCIENT SISTER KEEPSAKES & STAT UPGRADES:', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 1.5,
    });
    modal.add(keepLabel);

    // 4 Keepsake Cards Row
    const keepsakeInfo = [
      { id: 'keepsake_ribbon', name: "Wren's Ribbon", bonus: '+25 Max HP', biome: 'Catacombs Alcove', color: '#10b981', tex: 'keepsake_ribbon' },
      { id: 'keepsake_crest', name: "Percy's Crest", bonus: '+25 Max HP', biome: 'Foundry Vault', color: '#f59e0b', tex: 'keepsake_crest' },
      { id: 'keepsake_stardial', name: "Mona's Stardial", bonus: '+25 Max Soul', biome: 'Grotto Pinnacle', color: '#c084fc', tex: 'keepsake_stardial' },
      { id: 'keepsake_charm', name: "Tilly's Charm", bonus: '+25 Max Soul', biome: 'Spire Roost', color: '#ef4444', tex: 'keepsake_charm' },
    ];

    const collectedSet = new Set(data.collectedKeepsakes || []);
    const kSlotW = 132;
    const kStartX = cx - (4 * kSlotW + 3 * 8) / 2 + kSlotW / 2;

    keepsakeInfo.forEach((k, idx) => {
      const kx = kStartX + idx * (kSlotW + 8);
      const ky = cy - 40;
      const isOwned = collectedSet.has(k.id);

      const kBox = this.add.graphics();
      if (isOwned) {
        kBox.fillStyle(0x131a2e, 0.95);
        kBox.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(k.color).color, 1);
      } else {
        kBox.fillStyle(0x0a0c16, 0.6);
        kBox.lineStyle(1, 0x334155, 0.5);
      }
      kBox.fillRoundedRect(kx - kSlotW / 2, ky - 45, kSlotW, 90, 6);
      kBox.strokeRoundedRect(kx - kSlotW / 2, ky - 45, kSlotW, 90, 6);
      modal.add(kBox);

      const icon = this.add.image(kx, ky - 18, k.tex);
      icon.setDisplaySize(28, 28);
      if (!isOwned) icon.setAlpha(0.35);
      modal.add(icon);

      const kName = this.add.text(kx, ky + 4, k.name, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: isOwned ? '#f8fafc' : '#64748b',
      }).setOrigin(0.5);
      modal.add(kName);

      const kStatus = this.add.text(kx, ky + 22, isOwned ? `ACTIVE: ${k.bonus}` : `Hidden: ${k.biome}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9px',
        color: isOwned ? k.color : '#475569',
      }).setOrigin(0.5);
      modal.add(kStatus);
    });

    // Gathered Sisters Status Line
    const rescuedCount = (data.rescuedSisters ? data.rescuedSisters.length : 0) + 1;
    const gatheredText = this.add.text(cx, cy + 30, `SISTERS GATHERED AT CAMPFIRE: ${rescuedCount} / 4`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#e2e8f0',
      letterSpacing: 2,
    }).setOrigin(0.5);
    modal.add(gatheredText);

    // Notification toast placeholder inside modal
    let statusNotice = null;
    const havenButtons = [];

    // Helper to make button
    const makeButton = (bx, by, bw, bh, text, btnColor, clickFn) => {
      const btn = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(0x131728, 0.95);
      bg.lineStyle(2, btnColor, 0.9);
      bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
      bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
      btn.add(bg);

      const txt = this.add.text(0, 0, text, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f8fafc',
        letterSpacing: 1.5,
      }).setOrigin(0.5);
      btn.add(txt);

      btn.setSize(bw, bh);
      btn.setInteractive(new Phaser.Geom.Rectangle(-bw / 2, -bh / 2, bw, bh), Phaser.Geom.Rectangle.Contains);

      const btnIndex = havenButtons.length;
      const setHover = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x1e2640 : 0x131728, hover ? 1 : 0.95);
        bg.lineStyle(hover ? 2.5 : 2, hover ? 0xffffff : btnColor, 1);
        bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
        bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
        txt.setScale(hover ? 1.05 : 1);
        txt.setColor(hover ? '#ffffff' : '#f8fafc');
      };

      btn.on('pointerover', () => {
        if (this.currentModalFocus && this.currentModalFocus.id === 'haven') {
          if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
            this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
          }
          this.currentModalFocus.selectedIndex = btnIndex;
        }
        setHover(true);
      });

      btn.on('pointerout', () => {
        if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== btnIndex) {
          setHover(false);
        }
      });

      btn.on('pointerdown', () => clickFn());
      modal.add(btn);
      havenButtons.push({ container: btn, setHover, clickFn });
      return btn;
    };

    // 1. Rest & Replenish Button
    makeButton(cx - 215, cy + 90, 130, 42, '🔥 REST', 0x10b981, () => {
      gameScene.events.emit('request_rest_campfire');
      soundFX.playCampfireBanter();
      if (statusNotice) statusNotice.destroy();
      statusNotice = this.add.text(cx, cy + 145, '✨ ALL SISTERS REPLENISHED! HEALTH & SOUL FULL ✨', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#10b981',
      }).setOrigin(0.5);
      modal.add(statusNotice);
    });

    // 2. Switch Lead Sister Button
    makeButton(cx - 72, cy + 90, 140, 42, '👭 SWITCH', 0xf59e0b, () => {
      this.clearModalFocus('haven');
      modal.destroy();
      this.showLeadSisterSwapModal(data);
    });

    // 3. Talk to Sisters Button
    makeButton(cx + 72, cy + 90, 135, 42, '💬 CHAT', 0xc084fc, () => {
      this.clearModalFocus('haven');
      modal.destroy();
      this.showHavenSisterChatSelectModal(data);
    });

    // 4. Resume Button
    makeButton(cx + 215, cy + 90, 130, 42, '⚔ RESUME', 0x64748b, () => {
      this.clearModalFocus('haven');
      modal.destroy();
      this.scene.resume('GameScene');
    });

    // Controller navigation prompt at bottom
    const havenHint = this.add.text(cx, cy + cardH / 2 - 20, '🎮 [D-Pad / Stick] Navigate  •  [A] Select  •  [B] Resume Expedition', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(havenHint);

    this.setModalFocus({
      id: 'haven',
      items: havenButtons,
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: () => {
        this.clearModalFocus('haven');
        modal.destroy();
        this.scene.resume('GameScene');
      },
    });
  }

  // --- PHASE 4: HAVEN SISTER BANTER SELECTOR MODAL ---
  showHavenSisterChatSelectModal(data) {
    const w = this.scale.width;
    const h = this.scale.height;
    const modal = this.add.container(0, 0).setDepth(2600);

    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x03040a, 0.94);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    modal.add(backdrop);

    const cardW = 640;
    const cardH = 380;
    const cx = w / 2;
    const cy = h / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0c0d18, 0.98);
    panel.lineStyle(2.5, 0xc084fc, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    modal.add(panel);

    const title = this.add.text(cx, cy - cardH / 2 + 28, '💬 SPEAK WITH GATHERED SISTERS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#c084fc',
      letterSpacing: 2,
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.add.text(cx, cy - cardH / 2 + 52, 'Choose a sister to hear her reflections, combat advice, and keepsake clues.', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(subtitle);

    const availableSisters = (data.rescuedSisters || []).filter(id => id !== this.sisterId);
    const chatButtons = [];

    if (availableSisters.length === 0) {
      const emptyTxt = this.add.text(cx, cy - 10, 'No other sisters have returned to the campfire yet.\nExplore the biomes to rescue Wren, Percy, Mona, or Tilly!', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 6,
      }).setOrigin(0.5);
      modal.add(emptyTxt);
    } else {
      const slotW = 150;
      const startX = cx - (availableSisters.length * slotW + (availableSisters.length - 1) * 16) / 2 + slotW / 2;
      availableSisters.forEach((id, idx) => {
        const s = SISTERS_DATA[id];
        const sx = startX + idx * (slotW + 16);
        const sy = cy + 15;

        const card = this.add.container(sx, sy);
        const bg = this.add.graphics();
        bg.fillStyle(0x131728, 0.95);
        bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(s.themeColor).color, 0.9);
        bg.fillRoundedRect(-slotW / 2, -100, slotW, 200, 8);
        bg.strokeRoundedRect(-slotW / 2, -100, slotW, 200, 8);
        card.add(bg);

        const portrait = this.add.image(0, -45, `${id}_portrait`);
        portrait.setDisplaySize(64, 64);
        card.add(portrait);

        const name = this.add.text(0, 0, s.name.toUpperCase(), {
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: s.themeColor,
          letterSpacing: 1.5,
        }).setOrigin(0.5);
        card.add(name);

        const titleTxt = this.add.text(0, 20, s.title, {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '10px',
          color: '#cbd5e1',
        }).setOrigin(0.5);
        card.add(titleTxt);

        const talkBtn = this.add.container(0, 65);
        const tbg = this.add.graphics();
        tbg.fillStyle(0x1e1b4b, 1);
        tbg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(s.themeColor).color, 1);
        tbg.fillRoundedRect(-55, -14, 110, 28, 6);
        tbg.strokeRoundedRect(-55, -14, 110, 28, 6);
        talkBtn.add(tbg);

        const ttxt = this.add.text(0, 0, '💬 TALK', {
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#ffffff',
          letterSpacing: 1.5,
        }).setOrigin(0.5);
        talkBtn.add(ttxt);

        talkBtn.setSize(110, 28);
        talkBtn.setInteractive(new Phaser.Geom.Rectangle(-55, -14, 110, 28), Phaser.Geom.Rectangle.Contains);

        const bIdx = chatButtons.length;
        const setTalkHover = (hover) => {
          tbg.clear();
          tbg.fillStyle(hover ? 0x312e81 : 0x1e1b4b, 1);
          tbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : Phaser.Display.Color.HexStringToColor(s.themeColor).color, 1);
          tbg.fillRoundedRect(-55, -14, 110, 28, 6);
          tbg.strokeRoundedRect(-55, -14, 110, 28, 6);
          ttxt.setScale(hover ? 1.05 : 1.0);
        };

        const clickTalk = () => {
          modal.destroy();
          this.clearModalFocus('chat_select');
          const keepsakeMap = {
            wren: 'keepsake_ribbon',
            percy: 'keepsake_crest',
            mona: 'keepsake_stardial',
            tilly: 'keepsake_charm',
          };
          const gameScene = this.scene.get('GameScene');
          const hasKeepsake = gameScene && gameScene.player && gameScene.player.collectedKeepsakes.has(keepsakeMap[id]);
          this.showSisterBanterModal({
            sisterId: id,
            sisterData: s,
            currentLead: this.sisterData,
            hasKeepsake,
          });
        };

        talkBtn.on('pointerover', () => {
          if (this.currentModalFocus && this.currentModalFocus.id === 'chat_select') {
            if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
              this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
            }
            this.currentModalFocus.selectedIndex = bIdx;
          }
          setTalkHover(true);
        });

        talkBtn.on('pointerout', () => {
          if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== bIdx) setTalkHover(false);
        });

        talkBtn.on('pointerdown', clickTalk);
        card.add(talkBtn);
        modal.add(card);

        chatButtons.push({ container: talkBtn, setHover: setTalkHover, clickFn: clickTalk });
      });
    }

    // Back to Haven Button
    const backBtn = this.add.container(cx, cy + cardH / 2 - 36);
    const bbg = this.add.graphics();
    bbg.fillStyle(0x1e293b, 1);
    bbg.lineStyle(1.5, 0x64748b, 1);
    bbg.fillRoundedRect(-85, -15, 170, 30, 6);
    bbg.strokeRoundedRect(-85, -15, 170, 30, 6);
    backBtn.add(bbg);

    const btxt = this.add.text(0, 0, '← BACK TO HAVEN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    backBtn.add(btxt);

    backBtn.setSize(170, 30);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-85, -15, 170, 30), Phaser.Geom.Rectangle.Contains);

    const backIdx = chatButtons.length;
    const setBackHover = (hover) => {
      bbg.clear();
      bbg.fillStyle(hover ? 0x334155 : 0x1e293b, 1);
      bbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : 0x64748b, 1);
      bbg.fillRoundedRect(-85, -15, 170, 30, 6);
      bbg.strokeRoundedRect(-85, -15, 170, 30, 6);
      btxt.setScale(hover ? 1.05 : 1.0);
      btxt.setColor(hover ? '#ffffff' : '#cbd5e1');
    };

    const clickBack = () => {
      this.clearModalFocus('chat_select');
      modal.destroy();
      this.showCampfireHavenModal(data);
    };

    backBtn.on('pointerover', () => {
      if (this.currentModalFocus && this.currentModalFocus.id === 'chat_select') {
        if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
          this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
        }
        this.currentModalFocus.selectedIndex = backIdx;
      }
      setBackHover(true);
    });

    backBtn.on('pointerout', () => {
      if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== backIdx) setBackHover(false);
    });

    backBtn.on('pointerdown', clickBack);
    modal.add(backBtn);
    chatButtons.push({ container: backBtn, setHover: setBackHover, clickFn: clickBack });

    // Controller navigation prompt at bottom
    const chatHint = this.add.text(cx, cy + cardH / 2 - 12, '🎮 [D-Pad / Stick] Navigate  •  [A] Select  •  [B] Back to Haven', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10.5px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(chatHint);

    this.setModalFocus({
      id: 'chat_select',
      items: chatButtons,
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: clickBack,
    });
  }

  // --- PHASE 4: LEAD SISTER SWAPPING SELECTOR MODAL ---
  showLeadSisterSwapModal(data) {
    const gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;

    const modal = this.add.container(0, 0).setDepth(2600);

    // Blocker Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x03040a, 0.94);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    modal.add(backdrop);

    const cardW = 680;
    const cardH = 460;
    const cx = w / 2;
    const cy = h / 2;

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0c0d18, 0.98);
    panel.lineStyle(2.5, 0x38bdf8, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    modal.add(panel);

    // Title
    const title = this.add.text(cx, cy - cardH / 2 + 28, '👭 CHOOSE ACTIVE LEAD SISTER', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 3,
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.add.text(cx, cy - cardH / 2 + 52, 'Swap character control instantly. Upgrades & abilities are shared across all sisters.', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(subtitle);

    const rescuedSet = new Set(data.rescuedSisters || []);
    // The current lead is always unlocked
    rescuedSet.add(this.sisterId);

    const allSisters = ['wren', 'percy', 'mona', 'tilly'];
    const cardWidth = 145;
    const startX = cx - (4 * cardWidth + 3 * 10) / 2 + cardWidth / 2;
    const swapButtons = [];

    allSisters.forEach((id, index) => {
      const s = SISTERS_DATA[id];
      const isLead = id === this.sisterId;
      const isAvailable = rescuedSet.has(id);
      const sx = startX + index * (cardWidth + 10);
      const sy = cy + 20;

      const card = this.add.container(sx, sy);
      const bg = this.add.graphics();

      if (isLead) {
        bg.fillStyle(0x132a20, 0.95);
        bg.lineStyle(2, 0x10b981, 1);
      } else if (isAvailable) {
        bg.fillStyle(0x131728, 0.95);
        bg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(s.themeColor).color, 0.85);
      } else {
        bg.fillStyle(0x080910, 0.65);
        bg.lineStyle(1, 0x334155, 0.4);
      }

      bg.fillRoundedRect(-cardWidth / 2, -150, cardWidth, 300, 8);
      bg.strokeRoundedRect(-cardWidth / 2, -150, cardWidth, 300, 8);
      card.add(bg);

      // Portrait
      const portrait = this.add.image(0, -95, `${id}_portrait`);
      portrait.setDisplaySize(60, 60);
      if (!isAvailable) portrait.setAlpha(0.3);
      card.add(portrait);

      // Name & Title
      const sName = this.add.text(0, -52, s.name.toUpperCase(), {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: isAvailable ? s.themeColor : '#64748b',
        letterSpacing: 1.5,
      }).setOrigin(0.5);
      card.add(sName);

      const sTitle = this.add.text(0, -36, s.title, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9px',
        color: isAvailable ? '#94a3b8' : '#475569',
      }).setOrigin(0.5);
      card.add(sTitle);

      // Signature Ability
      const sAbility = this.add.text(0, -14, `★ ${s.startAbility}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: isAvailable ? s.accentColor : '#475569',
      }).setOrigin(0.5);
      card.add(sAbility);

      // Stats block
      const statTxt = isAvailable ?
        `HP: ${s.stats.health}  |  SOUL: ${s.stats.soul}\nSPEED: ${s.stats.speed}  |  DMG: ${s.stats.damage}` :
        `🔒 IMPRISONED\nIN THE ABYSS`;

      const stats = this.add.text(0, 22, statTxt, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9px',
        align: 'center',
        color: isAvailable ? '#cbd5e1' : '#ef4444',
        lineSpacing: 4,
      }).setOrigin(0.5);
      card.add(stats);

      // Action Button / Badge
      if (isLead) {
        const badge = this.add.text(0, 95, 'ACTIVE LEAD', {
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#10b981',
          backgroundColor: '#064e3b',
          padding: { x: 10, y: 5 },
        }).setOrigin(0.5);
        card.add(badge);
      } else if (isAvailable) {
        const selectBtn = this.add.container(0, 95);
        const sbg = this.add.graphics();
        sbg.fillStyle(0x1e1b4b, 1);
        sbg.lineStyle(1.5, 0x38bdf8, 1);
        sbg.fillRoundedRect(-52, -14, 104, 28, 6);
        sbg.strokeRoundedRect(-52, -14, 104, 28, 6);
        selectBtn.add(sbg);

        const stxt = this.add.text(0, 0, 'TAKE LEAD', {
          fontFamily: 'Cinzel, Georgia, serif',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#ffffff',
          letterSpacing: 1,
        }).setOrigin(0.5);
        selectBtn.add(stxt);

        selectBtn.setSize(104, 28);
        selectBtn.setInteractive(new Phaser.Geom.Rectangle(-52, -14, 104, 28), Phaser.Geom.Rectangle.Contains);

        const bIdx = swapButtons.length;
        const setSelectHover = (hover) => {
          sbg.clear();
          sbg.fillStyle(hover ? 0x312e81 : 0x1e1b4b, 1);
          sbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0x67e8f9 : 0x38bdf8, 1);
          sbg.fillRoundedRect(-52, -14, 104, 28, 6);
          sbg.strokeRoundedRect(-52, -14, 104, 28, 6);
          stxt.setColor(hover ? '#38bdf8' : '#ffffff');
          stxt.setScale(hover ? 1.05 : 1.0);
        };

        const clickSelect = () => {
          gameScene.events.emit('request_sister_swap', id);
          modal.destroy();
          this.clearModalFocus('sister_swap');
          this.scene.resume('GameScene');
        };

        selectBtn.on('pointerover', () => {
          if (this.currentModalFocus && this.currentModalFocus.id === 'sister_swap') {
            if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
              this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
            }
            this.currentModalFocus.selectedIndex = bIdx;
          }
          setSelectHover(true);
        });

        selectBtn.on('pointerout', () => {
          if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== bIdx) setSelectHover(false);
        });

        selectBtn.on('pointerdown', clickSelect);

        card.add(selectBtn);
        swapButtons.push({ container: selectBtn, setHover: setSelectHover, clickFn: clickSelect });
      } else {
        const lockedBadge = this.add.text(0, 95, '🔒 LOCKED', {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '10px',
          color: '#64748b',
          backgroundColor: '#0f172a',
          padding: { x: 10, y: 5 },
        }).setOrigin(0.5);
        card.add(lockedBadge);
      }

      modal.add(card);
    });

    // Back Button
    const backBtn = this.add.container(cx, cy + cardH / 2 - 38);
    const bbg = this.add.graphics();
    bbg.fillStyle(0x1e293b, 1);
    bbg.lineStyle(1.5, 0x64748b, 1);
    bbg.fillRoundedRect(-90, -16, 180, 32, 6);
    bbg.strokeRoundedRect(-90, -16, 180, 32, 6);
    backBtn.add(bbg);

    const btxt = this.add.text(0, 0, '← BACK TO HAVEN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    backBtn.add(btxt);

    backBtn.setSize(180, 32);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-90, -16, 180, 32), Phaser.Geom.Rectangle.Contains);

    const backIdx = swapButtons.length;
    const setBackHover = (hover) => {
      bbg.clear();
      bbg.fillStyle(hover ? 0x334155 : 0x1e293b, 1);
      bbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : 0x64748b, 1);
      bbg.fillRoundedRect(-90, -16, 180, 32, 6);
      bbg.strokeRoundedRect(-90, -16, 180, 32, 6);
      btxt.setScale(hover ? 1.05 : 1.0);
      btxt.setColor(hover ? '#ffffff' : '#cbd5e1');
    };

    const clickBack = () => {
      this.clearModalFocus('sister_swap');
      modal.destroy();
      this.showCampfireHavenModal(data);
    };

    backBtn.on('pointerover', () => {
      if (this.currentModalFocus && this.currentModalFocus.id === 'sister_swap') {
        if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
          this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
        }
        this.currentModalFocus.selectedIndex = backIdx;
      }
      setBackHover(true);
    });

    backBtn.on('pointerout', () => {
      if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== backIdx) setBackHover(false);
    });

    backBtn.on('pointerdown', clickBack);
    modal.add(backBtn);
    swapButtons.push({ container: backBtn, setHover: setBackHover, clickFn: clickBack });

    // Controller navigation prompt at bottom
    const swapHint = this.add.text(cx, cy + cardH / 2 - 14, '🎮 [D-Pad / Stick] Navigate  •  [A] Select  •  [B] Back to Haven', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10.5px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(swapHint);

    this.setModalFocus({
      id: 'sister_swap',
      items: swapButtons,
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: clickBack,
    });
  }

  // --- PHASE 4: SISTER CAMPFIRE BANTER & LORE MODAL ---
  showSisterBanterModal(data) {
    const { sisterId, sisterData, currentLead, hasKeepsake } = data;
    this.scene.pause('GameScene');

    const w = this.scale.width;
    const h = this.scale.height;

    const modal = this.add.container(0, 0).setDepth(2500);

    // Blocker Backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x04030a, 0.92);
    backdrop.fillRect(0, 0, w, h);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    modal.add(backdrop);

    const cardW = 600;
    const cardH = 370;
    const cx = w / 2;
    const cy = h / 2;

    // Panel with Sister Theme Glow
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0c18, 0.98);
    panel.lineStyle(2.5, Phaser.Display.Color.HexStringToColor(sisterData.themeColor).color, 1);
    panel.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    panel.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    modal.add(panel);

    // Large Bust Portrait with Halo
    const portraitBg = this.add.circle(cx - cardW / 2 + 75, cy - 65, 46, 0x1e1b4b);
    portraitBg.setStrokeStyle(2.5, Phaser.Display.Color.HexStringToColor(sisterData.themeColor).color);
    modal.add(portraitBg);

    const portrait = this.add.image(cx - cardW / 2 + 75, cy - 65, `${sisterId}_portrait`);
    portrait.setDisplaySize(84, 84);
    modal.add(portrait);

    // Sister Name & Title Header
    const nameTxt = this.add.text(cx - cardW / 2 + 140, cy - cardH / 2 + 32, sisterData.name.toUpperCase(), {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: sisterData.themeColor,
      letterSpacing: 3,
      shadow: { color: sisterData.themeColor, blur: 12, fill: true },
    });
    modal.add(nameTxt);

    const titleTxt = this.add.text(cx - cardW / 2 + 140, cy - cardH / 2 + 60, `${sisterData.title} • ${sisterData.role}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
    });
    modal.add(titleTxt);

    const weaponTxt = this.add.text(cx - cardW / 2 + 140, cy - cardH / 2 + 80, `Weapon: ${sisterData.weaponName}  |  Signature: ${sisterData.startAbility}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: sisterData.accentColor,
    });
    modal.add(weaponTxt);

    // Sister-Specific Narrative & Lore Dialogue Banks
    const dialogBanks = {
      wren: [
        `"It feels like an eternity since we sat around the bonfire together, ${currentLead.name}. The storm winds howling through the Spire are savage, but with our family united, no void can quench our flame."`,
        `"Listen closely on the timing: when you air dash with Shift, horizontal momentum overrides gravity completely. If you double jump first and dash at the apex, you can clear the widest chasms in the catacombs!"`,
        hasKeepsake ?
          `"My Zephyr Ribbon! You found it! With that enchanted silk woven into our cloaks, the brisk winds shield our very lifeblood (+25 Max Health)!"` :
          `"Before the Abyss Knights trapped me, I hid my Zephyr Ribbon high in the crypt alcoves above this hub. If you climb the upper stone ledges near the torches, you should spot its emerald shimmer!"`,
        `"Percy's armor is stalwart, but she carries the weight of the entire vanguard on her shoulders. Make sure she takes time to rest here by the embers."`,
      ],
      percy: [
        `"Stand easy, sister. As long as our shields interlock, nothing breaks our line. Sit, warm your hands, and catch your breath."`,
        `"My Aegis Bash doesn't just shatter cracked stone barriers. Time it against heavy enemy attacks and you will deflect their strikes while stunning them in their tracks!"`,
        hasKeepsake ?
          `"My imperial Aegis Crest! Bearing the royal lion into battle steels our constitution and bolsters our fortitude (+25 Max Health)!"` :
          `"I dropped my golden Aegis Crest somewhere deep in the Molten Foundry when the obsidian golems ambushed me. Look for cracked stone walls hiding secret alcoves down there!"`,
        `"Mona's starlight was the only beacon that kept me sane while shackled in the foundry. We owe our survival to one another."`,
      ],
      mona: [
        `"The void whispers endlessly in these forgotten depths, but the warmth of our sisterhood silences its malice completely. I see starlight shining in your eyes, ${currentLead.name}."`,
        `"My Astral Ray pierces infinitely through physical matter. When you encounter dormant crystalline switches, fire the ray to energize them—they will manifest spectral bridges across impossible voids."`,
        hasKeepsake ?
          `"My Astral Stardial! The celestial rings align once more. Our soul reserves are expanded beyond measure (+25 Max Soul)!"` :
          `"My Astral Stardial was lost on the highest crystal pinnacle in the Grotto. If you ascend the floating cyan platforms into the upper caves, you will feel its resonance!"`,
        `"Malakor's sanctum is bound by a quadruple runic barrier. Only when all four of our sister powers converge can the seal be shattered."`,
      ],
      tilly: [
        `"Haha! Did you miss me, ${currentLead.name}? The abyss tried to cage me, but nobody keeps Tilly locked up for long! Well... except until you busted me out, that is!"`,
        `"My Grapple Whip can latch onto any overhead gargoyle ring from below! Press V in mid-air and you'll slingshot upward like a firecracker—it lets you reach high ceilings with ease!"`,
        hasKeepsake ?
          `"You found my Scout Charm! That little lantern spark never burns out. Feel how much easier it is to channel soul energy now (+25 Max Soul)!"` :
          `"I lost my favorite lantern charm way up on the gale perches of the Howling Spire. You'll need to chain grapple swings along the upper parapets to reach it!"`,
        `"When this nightmare is over and the keep is saved, we are never splitting up again. Promise me, sister!"`,
      ],
    };

    const dialogLines = dialogBanks[sisterId] || dialogBanks.wren;
    let dialogIndex = 0;

    // Dialogue Text Box Container
    const dialogBox = this.add.graphics();
    dialogBox.fillStyle(0x131728, 0.95);
    dialogBox.lineStyle(1.5, 0x334155, 1);
    dialogBox.fillRoundedRect(cx - cardW / 2 + 25, cy + 10, cardW - 50, 115, 8);
    dialogBox.strokeRoundedRect(cx - cardW / 2 + 25, cy + 10, cardW - 50, 115, 8);
    modal.add(dialogBox);

    const dialogTxt = this.add.text(cx - cardW / 2 + 45, cy + 26, dialogLines[0], {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13.5px',
      color: '#f8fafc',
      wordWrap: { width: cardW - 90 },
      lineSpacing: 5,
    });
    modal.add(dialogTxt);

    const counterTxt = this.add.text(cx + cardW / 2 - 40, cy + 110, `Thought 1 of ${dialogLines.length}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#64748b',
    }).setOrigin(1, 0.5);
    modal.add(counterTxt);

    // Interactive Button 1: Next Thought
    const nextBtn = this.add.container(cx - 100, cy + cardH / 2 - 42);
    const nbg = this.add.graphics();
    nbg.fillStyle(0x1e1b4b, 1);
    nbg.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(sisterData.themeColor).color, 1);
    nbg.fillRoundedRect(-85, -16, 170, 32, 6);
    nbg.strokeRoundedRect(-85, -16, 170, 32, 6);
    nextBtn.add(nbg);

    const ntxt = this.add.text(0, 0, '💭 NEXT THOUGHT', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    nextBtn.add(ntxt);

    nextBtn.setSize(170, 32);
    nextBtn.setInteractive(new Phaser.Geom.Rectangle(-85, -16, 170, 32), Phaser.Geom.Rectangle.Contains);

    const setNextHover = (hover) => {
      nbg.clear();
      nbg.fillStyle(hover ? 0x312e81 : 0x1e1b4b, 1);
      nbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : Phaser.Display.Color.HexStringToColor(sisterData.themeColor).color, 1);
      nbg.fillRoundedRect(-85, -16, 170, 32, 6);
      nbg.strokeRoundedRect(-85, -16, 170, 32, 6);
      ntxt.setScale(hover ? 1.05 : 1.0);
    };

    const clickNext = () => {
      dialogIndex = (dialogIndex + 1) % dialogLines.length;
      dialogTxt.setText(dialogLines[dialogIndex]);
      counterTxt.setText(`Thought ${dialogIndex + 1} of ${dialogLines.length}`);
      soundFX.playCampfireBanter();
    };

    nextBtn.on('pointerover', () => {
      if (this.currentModalFocus && this.currentModalFocus.id === 'sister_banter') {
        if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
          this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
        }
        this.currentModalFocus.selectedIndex = 0;
      }
      setNextHover(true);
    });

    nextBtn.on('pointerout', () => {
      if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== 0) setNextHover(false);
    });

    nextBtn.on('pointerdown', clickNext);
    modal.add(nextBtn);

    // Interactive Button 2: Farewell / Resume
    const closeBtn = this.add.container(cx + 100, cy + cardH / 2 - 42);
    const cbg = this.add.graphics();
    cbg.fillStyle(0x1e293b, 1);
    cbg.lineStyle(1.5, 0x64748b, 1);
    cbg.fillRoundedRect(-85, -16, 170, 32, 6);
    cbg.strokeRoundedRect(-85, -16, 170, 32, 6);
    closeBtn.add(cbg);

    const ctxt = this.add.text(0, 0, '👋 FAREWELL', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    closeBtn.add(ctxt);

    closeBtn.setSize(170, 32);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-85, -16, 170, 32), Phaser.Geom.Rectangle.Contains);

    const setCloseHover = (hover) => {
      cbg.clear();
      cbg.fillStyle(hover ? 0x334155 : 0x1e293b, 1);
      cbg.lineStyle(hover ? 2.5 : 1.5, hover ? 0xffffff : 0x64748b, 1);
      cbg.fillRoundedRect(-85, -16, 170, 32, 6);
      cbg.strokeRoundedRect(-85, -16, 170, 32, 6);
      ctxt.setScale(hover ? 1.05 : 1.0);
      ctxt.setColor(hover ? '#ffffff' : '#cbd5e1');
    };

    const clickClose = () => {
      this.clearModalFocus('sister_banter');
      modal.destroy();
      this.scene.resume('GameScene');
    };

    closeBtn.on('pointerover', () => {
      if (this.currentModalFocus && this.currentModalFocus.id === 'sister_banter') {
        if (this.currentModalFocus.items[this.currentModalFocus.selectedIndex]) {
          this.currentModalFocus.items[this.currentModalFocus.selectedIndex].setHover(false);
        }
        this.currentModalFocus.selectedIndex = 1;
      }
      setCloseHover(true);
    });

    closeBtn.on('pointerout', () => {
      if (!this.currentModalFocus || this.currentModalFocus.selectedIndex !== 1) setCloseHover(false);
    });

    closeBtn.on('pointerdown', clickClose);
    modal.add(closeBtn);

    // Controller navigation prompt at bottom
    const banterHint = this.add.text(cx, cy + cardH / 2 - 14, '🎮 [D-Pad / Stick] Navigate  •  [A] Select  •  [B] Farewell', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10.5px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    modal.add(banterHint);

    this.setModalFocus({
      id: 'sister_banter',
      items: [
        { container: nextBtn, setHover: setNextHover, clickFn: clickNext },
        { container: closeBtn, setHover: setCloseHover, clickFn: clickClose },
      ],
      selectedIndex: 0,
      orientation: 'horizontal',
      onCancel: clickClose,
    });
  }
}


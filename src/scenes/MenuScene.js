import Phaser from 'phaser';
import { soundFX } from '../audio/SoundFX.js';
import { SaveManager } from '../utils/SaveManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedBtnIndex = 0;
    this.buttons = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.buttons = [];

    // Atmospheric dark background
    const bg = this.add.image(w / 2, h / 2, 'bg_citadel').setDisplaySize(w, h);

    // Dark vignette overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0714, 0.70);
    overlay.fillRect(0, 0, w, h);

    // Floating fog particles
    for (let i = 0; i < 20; i++) {
      const fog = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(h * 0.4, h),
        Phaser.Math.Between(40, 100),
        0x1e1538,
        0.25
      );
      this.tweens.add({
        targets: fog,
        x: fog.x + Phaser.Math.Between(40, 100),
        alpha: { from: 0.1, to: 0.35 },
        duration: Phaser.Math.Between(4000, 7000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title & Subtitle
    this.add.text(w / 2, h * 0.22, 'ABYSSAL BLADE', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#e2e8f0',
      letterSpacing: 8,
      shadow: { color: '#a855f7', blur: 18, fill: true },
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.31, 'A DARK FANTASY METROIDVANIA CHRONICLE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
      letterSpacing: 4,
    }).setOrigin(0.5);

    const hasSave = SaveManager.hasSave();
    const saveData = hasSave ? SaveManager.getSaveData() : null;

    const createButton = (bx, by, bw, bh, text, subtext, colorHex, clickFn) => {
      const container = this.add.container(bx, by);
      const bg = this.add.graphics();
      bg.fillStyle(0x151228, 0.95);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(colorHex).color, 0.9);
      bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
      bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
      container.add(bg);

      const t = this.add.text(0, subtext ? -8 : 0, text, {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 2,
      }).setOrigin(0.5);
      container.add(t);

      if (subtext) {
        const st = this.add.text(0, 12, subtext, {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '10px',
          color: colorHex,
        }).setOrigin(0.5);
        container.add(st);
      }

      container.setSize(bw, bh);
      container.setInteractive({ useHandCursor: true });

      const setHover = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x2e1b4b : 0x151228, 1);
        bg.lineStyle(hover ? 2.5 : 2, Phaser.Display.Color.HexStringToColor(colorHex).color, 1);
        bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
        bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
        container.setScale(hover ? 1.03 : 1.0);
      };

      container.on('pointerover', () => setHover(true));
      container.on('pointerout', () => setHover(false));
      container.on('pointerdown', () => clickFn());

      this.buttons.push({ container, setHover, clickFn });
      return container;
    };

    if (hasSave && saveData) {
      // 1. Continue Saved Expedition
      const sisterName = saveData.leadSisterId ? saveData.leadSisterId.toUpperCase() : 'WREN';
      const keepsakesCount = saveData.collectedKeepsakes ? saveData.collectedKeepsakes.length : 0;
      const sub = `${sisterName} • ${keepsakesCount}/4 KEEPSAKES • RESUMING AT HAVEN`;

      createButton(w / 2, h * 0.44, 320, 46, 'CONTINUE EXPEDITION', sub, '#38bdf8', () => {
        soundFX.init();
        soundFX.resume();
        soundFX.startBGM(saveData.leadSisterId || 'wren');
        soundFX.playCollect();

        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('GameScene', { loadSavedGame: true, savedData: saveData });
          this.scene.start('UIScene', { sisterId: saveData.leadSisterId || 'wren' });
        });
      });

      // 2. New Expedition
      createButton(w / 2, h * 0.55, 320, 42, 'NEW EXPEDITION', 'Choose a new lead sister & begin anew', '#a855f7', () => {
        soundFX.init();
        soundFX.resume();
        soundFX.startBGM();
        soundFX.playSlash(2);

        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('CharacterSelectScene');
        });
      });
    } else {
      // Single Start Expedition Button
      createButton(w / 2, h * 0.48, 280, 46, 'ENTER THE CRYPT', 'Choose your Sister to begin', '#a855f7', () => {
        soundFX.init();
        soundFX.resume();
        soundFX.startBGM();
        soundFX.playSlash(2);

        this.cameras.main.fade(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('CharacterSelectScene');
        });
      });
    }

    // Controls & Gamepad Guide Box
    const guideBox = this.add.graphics();
    guideBox.fillStyle(0x0b0d17, 0.88);
    guideBox.lineStyle(1.5, 0x334155, 0.8);
    guideBox.fillRoundedRect(w / 2 - 280, h * 0.67, 560, 130, 8);
    guideBox.strokeRoundedRect(w / 2 - 280, h * 0.67, 560, 130, 8);

    this.add.text(w / 2, h * 0.70, '✦ HYBRID CONTROLS: KEYBOARD & GAMEPAD SUPPORTED ✦', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.81, 
      '⌨️ KEYBOARD: A/D (Move)  |  Space / W (Jump)  |  Z / Left-Click (Attack)\n' +
      'Shift (Dash)  |  X / Q (Spell)  |  F (Shield)  |  R (Ray)  |  V (Grapple)  |  E (Interact)\n' +
      '🎮 GAMEPAD: Left Stick (Move)  |  [A] Jump  |  [X] Attack  |  [RT] Dash\n' +
      '[LT] Shield Bash  |  [LB] Astral Ray  |  [R3] Grapple  |  [B] Interact / Rest',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 4,
      }
    ).setOrigin(0.5);

    // Initial button highlight
    if (this.buttons.length > 0) {
      this.buttons[0].setHover(true);
    }

    // Keyboard support for Menu
    this.input.keyboard.on('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        this.buttons[this.selectedBtnIndex]?.setHover(false);
        this.selectedBtnIndex = (this.selectedBtnIndex - 1 + this.buttons.length) % this.buttons.length;
        this.buttons[this.selectedBtnIndex]?.setHover(true);
        soundFX.playSlash(1);
      } else if (key === 'arrowdown' || key === 's') {
        this.buttons[this.selectedBtnIndex]?.setHover(false);
        this.selectedBtnIndex = (this.selectedBtnIndex + 1) % this.buttons.length;
        this.buttons[this.selectedBtnIndex]?.setHover(true);
        soundFX.playSlash(1);
      } else if (key === 'enter' || key === ' ' || key === 'z' || key === 'e') {
        if (this.buttons[this.selectedBtnIndex]) {
          this.buttons[this.selectedBtnIndex].clickFn();
        }
      }
    });
  }

  update() {
    // Gamepad menu selection
    if (navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads && (pads[0] || pads[1]);
      if (pad) {
        const stickY = pad.axes[1] || 0;
        const dpadUp = pad.buttons[12] && pad.buttons[12].pressed;
        const dpadDown = pad.buttons[13] && pad.buttons[13].pressed;
        const btnA = pad.buttons[0] && pad.buttons[0].pressed;
        const btnStart = pad.buttons[9] && pad.buttons[9].pressed;

        if ((stickY < -0.4 || dpadUp) && !this.padUpPressed) {
          this.padUpPressed = true;
          this.buttons[this.selectedBtnIndex].setHover(false);
          this.selectedBtnIndex = (this.selectedBtnIndex - 1 + this.buttons.length) % this.buttons.length;
          this.buttons[this.selectedBtnIndex].setHover(true);
          soundFX.playSlash(1);
        } else if (stickY > -0.2 && !dpadUp) {
          this.padUpPressed = false;
        }

        if ((stickY > 0.4 || dpadDown) && !this.padDownPressed) {
          this.padDownPressed = true;
          this.buttons[this.selectedBtnIndex].setHover(false);
          this.selectedBtnIndex = (this.selectedBtnIndex + 1) % this.buttons.length;
          this.buttons[this.selectedBtnIndex].setHover(true);
          soundFX.playSlash(1);
        } else if (stickY < 0.2 && !dpadDown) {
          this.padDownPressed = false;
        }

        if ((btnA || btnStart) && !this.padConfirmPressed) {
          this.padConfirmPressed = true;
          if (this.buttons[this.selectedBtnIndex]) {
            this.buttons[this.selectedBtnIndex].clickFn();
          }
        } else if (!btnA && !btnStart) {
          this.padConfirmPressed = false;
        }
      }
    }
  }
}


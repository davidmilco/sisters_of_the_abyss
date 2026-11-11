import Phaser from 'phaser';
import { SISTERS_DATA } from '../utils/SisterSpriteGenerator.js';
import { soundFX } from '../audio/SoundFX.js';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelectScene');
    this.sisters = Object.values(SISTERS_DATA);
    this.selectedIndex = 0;
    this.cards = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Atmospheric background
    const bg = this.add.image(w / 2, h / 2, 'bg_citadel').setDisplaySize(w, h);
    const overlay = this.add.graphics();
    overlay.fillStyle(0x07060f, 0.82);
    overlay.fillRect(0, 0, w, h);

    // Header Title
    this.add.text(w / 2, 38, 'CHOOSE YOUR SISTER', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 6,
      shadow: { color: '#a855f7', blur: 14, fill: true },
    }).setOrigin(0.5);

    this.add.text(w / 2, 68, 'Four sisters separated by the abyss. Venture forth to rescue and unite your kin.', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Create 4 sister cards
    this.cards = [];
    const cardWidth = 205;
    const cardHeight = 360;
    const startX = (w - (4 * cardWidth + 3 * 22)) / 2 + cardWidth / 2;
    const cardY = 270;

    this.sisters.forEach((sister, idx) => {
      const cardX = startX + idx * (cardWidth + 22);
      const card = this.createSisterCard(sister, cardX, cardY, cardWidth, cardHeight, idx);
      this.cards.push(card);
    });

    // Keyboard navigation (Left, Right, Enter, Space)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Bottom Start Confirmation Button
    this.createConfirmButton(w / 2, h - 45);

    // Select first card by default
    this.selectCard(0);
  }

  createSisterCard(sister, x, y, width, height, index) {
    const container = this.add.container(x, y);

    // Card background panel
    const bg = this.add.graphics();
    bg.fillStyle(0x0e101d, 0.9);
    bg.lineStyle(2, 0x334155, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    container.add(bg);

    // Highlight border graphic (active when selected)
    const glow = this.add.graphics();
    glow.lineStyle(3, Phaser.Display.Color.HexStringToColor(sister.themeColor).color, 1);
    glow.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    glow.setVisible(false);
    container.add(glow);

    // Portrait image
    const portrait = this.add.image(0, -height / 2 + 58, `${sister.id}_portrait`);
    portrait.setDisplaySize(74, 74);
    container.add(portrait);

    // Sister Name
    const nameText = this.add.text(0, -height / 2 + 115, sister.name.toUpperCase(), {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: sister.themeColor,
      letterSpacing: 2,
    }).setOrigin(0.5);
    container.add(nameText);

    // Sister Title
    const titleText = this.add.text(0, -height / 2 + 138, sister.title, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#cbd5e1',
      letterSpacing: 1,
    }).setOrigin(0.5);
    container.add(titleText);

    // Sister Quote
    const quoteText = this.add.text(0, -height / 2 + 164, sister.quote, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      fontStyle: 'italic',
      color: '#94a3b8',
      align: 'center',
      wordWrap: { width: width - 24 },
    }).setOrigin(0.5);
    container.add(quoteText);

    // Starting Ability Box
    const abilityBox = this.add.graphics();
    abilityBox.fillStyle(0x16182a, 0.8);
    abilityBox.fillRoundedRect(-width / 2 + 12, -height / 2 + 195, width - 24, 75, 6);
    container.add(abilityBox);

    const abLabel = this.add.text(0, -height / 2 + 208, 'STARTING ABILITY', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '8px',
      color: sister.accentColor,
      letterSpacing: 1,
    }).setOrigin(0.5);
    container.add(abLabel);

    const abName = this.add.text(0, -height / 2 + 224, sister.startAbility, {
      fontFamily: 'Cinzel, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 30 },
    }).setOrigin(0.5);
    container.add(abName);

    const abDesc = this.add.text(0, -height / 2 + 250, sister.abilityDesc, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      color: '#94a3b8',
      align: 'center',
      wordWrap: { width: width - 30 },
      lineSpacing: 2,
    }).setOrigin(0.5);
    container.add(abDesc);

    // Stat bars
    const statsY = -height / 2 + 295;
    this.addStatRow(container, -width / 2 + 16, statsY, 'SPD', sister.stats.speed / 280, sister.themeColor);
    this.addStatRow(container, -width / 2 + 16, statsY + 18, 'HP', sister.stats.health / 140, '#ef4444');
    this.addStatRow(container, -width / 2 + 16, statsY + 36, 'SOUL', sister.stats.soul / 150, '#06b6d4');

    // Interactive card hit area
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.selectCard(index);
    });

    container.on('pointerdown', () => {
      this.selectCard(index);
      this.confirmSelection();
    });

    return { container, bg, glow, sister, index };
  }

  addStatRow(container, x, y, label, pct, colorHex) {
    const lbl = this.add.text(x, y, label, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      color: '#cbd5e1',
    });
    container.add(lbl);

    const barBg = this.add.rectangle(x + 40, y + 5, 120, 6, 0x1e293b).setOrigin(0, 0.5);
    const barFill = this.add.rectangle(x + 40, y + 5, 120 * pct, 6, Phaser.Display.Color.HexStringToColor(colorHex).color).setOrigin(0, 0.5);
    container.add(barBg);
    container.add(barFill);
  }

  selectCard(index) {
    this.selectedIndex = index;
    const selectedSister = this.sisters[this.selectedIndex];
    soundFX.playSisterTheme(selectedSister.id);

    this.cards.forEach((card, i) => {
      const isSelected = i === index;
      card.glow.setVisible(isSelected);
      card.container.setScale(isSelected ? 1.04 : 1.0);
      card.container.setDepth(isSelected ? 10 : 1);
    });

    if (this.confirmBtnText) {
      this.confirmBtnText.setText(`VENTURE FORTH AS ${selectedSister.name.toUpperCase()}`);
    }
  }

  createConfirmButton(x, y) {
    const container = this.add.container(x, y);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7c3aed, 0.95);
    btnBg.lineStyle(2, 0xc084fc, 1);
    btnBg.fillRoundedRect(-160, -18, 320, 36, 6);
    btnBg.strokeRoundedRect(-160, -18, 320, 36, 6);
    container.add(btnBg);

    this.confirmBtnText = this.add.text(0, 0, 'VENTURE FORTH AS WREN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 2,
    }).setOrigin(0.5);
    container.add(this.confirmBtnText);

    container.setSize(320, 36);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x9333ea, 1);
      btnBg.lineStyle(2, 0xf0abfc, 1);
      btnBg.fillRoundedRect(-160, -18, 320, 36, 6);
      btnBg.strokeRoundedRect(-160, -18, 320, 36, 6);
    });

    container.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x7c3aed, 0.95);
      btnBg.lineStyle(2, 0xc084fc, 1);
      btnBg.fillRoundedRect(-160, -18, 320, 36, 6);
      btnBg.strokeRoundedRect(-160, -18, 320, 36, 6);
    });

    container.on('pointerdown', () => {
      this.confirmSelection();
    });
  }

  confirmSelection() {
    const chosenSister = this.sisters[this.selectedIndex];
    soundFX.playCollect();

    this.cameras.main.fade(350, 0, 0, 0);
    this.time.delayedCall(350, () => {
      this.scene.start('GameScene', { sisterId: chosenSister.id });
      this.scene.start('UIScene', { sisterId: chosenSister.id });
    });
  }

  update() {
    // Check Gamepad navigation
    if (navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads && (pads[0] || pads[1]);
      if (pad) {
        const leftStickX = pad.axes[0] || 0;
        const dpadLeft = pad.buttons[14] && pad.buttons[14].pressed;
        const dpadRight = pad.buttons[15] && pad.buttons[15].pressed;
        const btnA = pad.buttons[0] && pad.buttons[0].pressed;
        const btnStart = pad.buttons[9] && pad.buttons[9].pressed;

        if ((leftStickX < -0.4 || dpadLeft) && !this.padLeftPressed) {
          this.padLeftPressed = true;
          const nextIndex = (this.selectedIndex - 1 + this.sisters.length) % this.sisters.length;
          this.selectCard(nextIndex);
        } else if (leftStickX > -0.2 && !dpadLeft) {
          this.padLeftPressed = false;
        }

        if ((leftStickX > 0.4 || dpadRight) && !this.padRightPressed) {
          this.padRightPressed = true;
          const nextIndex = (this.selectedIndex + 1) % this.sisters.length;
          this.selectCard(nextIndex);
        } else if (leftStickX < 0.2 && !dpadRight) {
          this.padRightPressed = false;
        }

        if ((btnA || btnStart) && !this.padConfirmPressed) {
          this.padConfirmPressed = true;
          this.confirmSelection();
        } else if (!btnA && !btnStart) {
          this.padConfirmPressed = false;
        }
      }
    }

    // Keyboard navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA)) {
      const nextIndex = (this.selectedIndex - 1 + this.sisters.length) % this.sisters.length;
      this.selectCard(nextIndex);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD)) {
      const nextIndex = (this.selectedIndex + 1) % this.sisters.length;
      this.selectCard(nextIndex);
    } else if (Phaser.Input.Keyboard.JustDown(this.keyEnter) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.confirmSelection();
    }
  }
}

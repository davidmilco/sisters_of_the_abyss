import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { soundFX } from './audio/SoundFX.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 920 },
      debug: false,
    },
  },
  input: {
    gamepad: true,
  },
  scene: [BootScene, MenuScene, CharacterSelectScene, GameScene, UIScene],
};

const game = new Phaser.Game(config);
window.game = game;

// Global Keyboard Shortcuts (M for mute, F for fullscreen)
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    const isMuted = soundFX.toggleMute();
    console.log(`Audio ${isMuted ? 'Muted' : 'Unmuted'}`);
  }
  if (e.key === 'f' || e.key === 'F') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
});

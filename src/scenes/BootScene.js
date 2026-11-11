import Phaser from 'phaser';
import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import { soundFX } from '../audio/SoundFX.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Generate all procedural pixel/vector textures directly into Phaser's Texture Manager
    SpriteGenerator.createAllTextures(this);

    // Click anywhere to activate audio context and launch menu
    this.scene.start('MenuScene');
  }
}

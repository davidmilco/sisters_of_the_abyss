import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class StormHarpy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'harpy_fly_0', 50, 18);

    this.body.setSize(26, 32);
    this.body.setOffset(11, 8);
    this.body.setAllowGravity(false);

    this.homeX = x;
    this.homeY = y;
    this.patrolStartX = x - 140;
    this.patrolEndX = x + 140;
    this.patrolSpeed = 80;
    this.diveSpeed = 240;
    this.direction = 1;

    this.isDiving = false;
    this.diveCooldown = false;
  }

  update(player) {
    if (this.isDead || this.isHurt) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (this.isDiving) {
      this.setTexture('harpy_dive');
      return;
    }

    // Wing flapping animation
    const animFrame = Math.floor((this.scene.time.now / 130) % 2);
    this.setTexture(`harpy_fly_${animFrame}`);

    // Check if player is below and in range -> Initiate Dive
    if (dist < 280 && dy > 40 && dy < 220 && Math.abs(dx) < 180 && !this.diveCooldown) {
      this.performDive(player);
      return;
    }

    // Normal aerial patrol
    if (this.x >= this.patrolEndX) {
      this.direction = -1;
    } else if (this.x <= this.patrolStartX) {
      this.direction = 1;
    }

    this.body.setVelocityX(this.direction * this.patrolSpeed);
    this.body.setVelocityY(Math.sin(this.scene.time.now / 300) * 20);
    this.setFlipX(this.direction === -1);
  }

  performDive(player) {
    this.isDiving = true;
    this.diveCooldown = true;
    this.setFlipX(player.x < this.x);

    soundFX.playHarpyDive();
    this.setTexture('harpy_dive');

    // Dive-bomb diagonally toward player's position
    this.scene.physics.moveTo(this, player.x, player.y, this.diveSpeed);

    // After diving down, pull up and return toward patrol height
    this.scene.time.delayedCall(700, () => {
      if (this.isDead) return;
      this.isDiving = false;
      this.body.setVelocity(0, -120);

      this.scene.time.delayedCall(800, () => {
        if (!this.isDead) {
          this.body.setVelocity(0, 0);
        }
      });
    });

    this.scene.time.delayedCall(2400, () => {
      this.diveCooldown = false;
    });
  }
}

import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class ArcaneWisp extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'wisp_idle_0', 45, 16);

    this.body.setSize(24, 24);
    this.body.setOffset(8, 8);
    this.body.setAllowGravity(false);

    this.homeX = x;
    this.homeY = y;
    this.moveSpeed = 75;
    this.attackCooldown = false;
    this.shootTimer = 0;
  }

  update(player) {
    if (this.isDead || this.isHurt) return;

    // Pulsing idle animation
    const animFrame = Math.floor((this.scene.time.now / 160) % 2);
    this.setTexture(`wisp_idle_${animFrame}`);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist < 320) {
      // Orbit around player in an erratic celestial pattern
      const angle = this.scene.time.now / 600;
      const targetX = player.x + Math.cos(angle) * 140;
      const targetY = player.y - 70 + Math.sin(angle) * 40;

      this.scene.physics.moveTo(this, targetX, targetY, this.moveSpeed);

      if (!this.attackCooldown && dist < 260) {
        this.castSpark(player);
      }
    } else {
      // Gentle sine hovering at home position
      const hoverY = this.homeY + Math.sin(this.scene.time.now / 350) * 16;
      this.body.setVelocity(0, 0);
      this.y = hoverY;
    }
  }

  castSpark(player) {
    this.attackCooldown = true;
    soundFX.playWispSpark();

    this.scene.spawnWispSpark(this.x, this.y, player.x, player.y);

    this.scene.time.delayedCall(2200, () => {
      this.attackCooldown = false;
    });
  }
}

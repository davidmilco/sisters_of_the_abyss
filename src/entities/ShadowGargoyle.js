import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class ShadowGargoyle extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'gargoyle_fly_0', 40, 14);

    this.body.setSize(28, 28);
    this.body.setOffset(8, 6);
    this.body.setAllowGravity(false); // flying enemy

    this.homeY = y;
    this.homeX = x;
    this.flySpeed = 90;
    this.shootCooldown = false;
  }

  update(player) {
    if (this.isDead || this.isHurt) return;

    // Wing flap animation
    const animFrame = Math.floor((this.scene.time.now / 140) % 2);
    this.setTexture(`gargoyle_fly_${animFrame}`);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const dx = player.x - this.x;
    this.setFlipX(dx < 0);

    // If player in range, hover above player and fire cyan embers
    if (dist < 320) {
      const targetY = player.y - 100;
      const targetX = player.x + (dx > 0 ? -120 : 120);

      // Smooth flying approach
      this.scene.physics.moveTo(this, targetX, targetY, this.flySpeed);

      if (!this.shootCooldown && dist < 280) {
        this.spitEmber(player);
      }
    } else {
      // Gentle hovering wave at home position
      const hoverY = this.homeY + Math.sin(this.scene.time.now / 400) * 20;
      this.body.setVelocity(0, 0);
      this.y = hoverY;
    }
  }

  spitEmber(player) {
    this.shootCooldown = true;

    // Fire cyan ember projectile
    this.scene.spawnEmber(this.x, this.y, player.x, player.y);

    this.scene.time.delayedCall(1800, () => {
      this.shootCooldown = false;
    });
  }
}

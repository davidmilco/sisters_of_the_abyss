import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class MagmaSentinel extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'sentinel_idle_0', 120, 24);

    this.body.setSize(38, 56);
    this.body.setOffset(8, 8);
    this.setCollideWorldBounds(true);

    this.patrolStartX = x - 100;
    this.patrolEndX = x + 100;
    this.patrolSpeed = 35;
    this.chaseSpeed = 70;
    this.direction = 1;

    this.isAttacking = false;
    this.attackCooldown = false;
  }

  update(player) {
    if (this.isDead || this.isHurt) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (this.isAttacking) return;

    // In melee range -> Ground Slam
    if (Math.abs(dx) < 65 && Math.abs(dy) < 45 && !this.attackCooldown) {
      this.performSlam(player);
      return;
    }

    // Mid-range -> Spits molten lava ball
    if (dist < 280 && dist > 110 && Math.abs(dy) < 60 && !this.attackCooldown) {
      this.spitMagma(player);
      return;
    }

    // Chase player if in aggro range
    if (dist < this.aggroRange && Math.abs(dy) < 90) {
      this.direction = dx > 0 ? 1 : -1;
      this.body.setVelocityX(this.direction * this.chaseSpeed);
      this.setFlipX(this.direction === -1);
    } else {
      // Normal patrol
      if (this.x >= this.patrolEndX) {
        this.direction = -1;
      } else if (this.x <= this.patrolStartX) {
        this.direction = 1;
      }
      this.body.setVelocityX(this.direction * this.patrolSpeed);
      this.setFlipX(this.direction === -1);
    }

    // Idle walking animation
    const animFrame = Math.floor((this.scene.time.now / 240) % 2);
    this.setTexture(`sentinel_idle_${animFrame}`);
  }

  performSlam(player) {
    this.isAttacking = true;
    this.attackCooldown = true;
    this.body.setVelocityX(0);
    this.setTexture('sentinel_slam');

    soundFX.playSentinelSlam();
    this.scene.cameras.main.shake(160, 0.008);

    // Shockwave forward
    const dir = this.flipX ? -1 : 1;
    this.scene.spawnShockwave(this.x + dir * 28, this.y + 12, dir);

    // Melee hit check
    if (Math.abs(player.x - this.x) < 70 && Math.abs(player.y - this.y) < 50) {
      player.takeDamage(this.damage, this.x);
    }

    this.scene.time.delayedCall(450, () => {
      this.isAttacking = false;
      this.setTexture('sentinel_idle_0');
    });

    this.scene.time.delayedCall(1600, () => {
      this.attackCooldown = false;
    });
  }

  spitMagma(player) {
    this.isAttacking = true;
    this.attackCooldown = true;
    this.body.setVelocityX(0);

    const dir = player.x > this.x ? 1 : -1;
    this.setFlipX(dir === -1);

    this.scene.spawnMagmaBall(this.x + dir * 20, this.y - 8, player.x, player.y);

    this.scene.time.delayedCall(350, () => {
      this.isAttacking = false;
    });

    this.scene.time.delayedCall(2000, () => {
      this.attackCooldown = false;
    });
  }
}

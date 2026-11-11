import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

export class SkeletonKnight extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'skel_walk_0', 60, 18);

    this.body.setSize(24, 48);
    this.body.setOffset(12, 8);
    this.setCollideWorldBounds(true);

    this.patrolStartX = x - 120;
    this.patrolEndX = x + 120;
    this.patrolSpeed = 50;
    this.chaseSpeed = 110;
    this.direction = 1; // 1 = right, -1 = left

    this.isAttacking = false;
    this.attackCooldown = false;
  }

  update(player) {
    if (this.isDead || this.isHurt) return;

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const dx = player.x - this.x;

    // In attack range
    if (Math.abs(dx) < 42 && Math.abs(player.y - this.y) < 35 && !this.attackCooldown && !this.isAttacking) {
      this.performAttack(player);
      return;
    }

    if (this.isAttacking) return;

    // Player detected -> Chase player
    if (distToPlayer < this.aggroRange && Math.abs(player.y - this.y) < 90) {
      this.direction = dx > 0 ? 1 : -1;
      this.body.setVelocityX(this.direction * this.chaseSpeed);
      this.setFlipX(this.direction === -1);
    } else {
      // Normal Patrol
      if (this.x >= this.patrolEndX) {
        this.direction = -1;
      } else if (this.x <= this.patrolStartX) {
        this.direction = 1;
      }
      this.body.setVelocityX(this.direction * this.patrolSpeed);
      this.setFlipX(this.direction === -1);
    }

    // Walking animation
    const animFrame = Math.floor((this.scene.time.now / 180) % 2);
    this.setTexture(`skel_walk_${animFrame}`);
  }

  performAttack(player) {
    this.isAttacking = true;
    this.attackCooldown = true;
    this.body.setVelocityX(0);
    this.setTexture('skel_attack');

    // Swing windup then damage check
    this.scene.time.delayedCall(220, () => {
      if (this.isDead) return;
      const dx = player.x - this.x;
      if (Math.abs(dx) < 55 && Math.abs(player.y - this.y) < 40) {
        player.takeDamage(this.damage, this.x);
      }
    });

    this.scene.time.delayedCall(450, () => {
      this.isAttacking = false;
    });

    this.scene.time.delayedCall(1200, () => {
      this.attackCooldown = false;
    });
  }
}

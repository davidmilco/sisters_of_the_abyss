import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class BossIgnis extends Enemy {
  constructor(scene, x, y) {
    // 420 Max Health for Foundry Colossus
    super(scene, x, y, 'boss_ignis_idle', 420, 22);

    this.body.setSize(54, 84);
    this.body.setOffset(15, 10);
    this.setCollideWorldBounds(true);

    this.bossName = 'IGNIS, THE OBSIDIAN COLOSSUS';
    this.bossActive = false;
    this.isAttacking = false;
    this.actionTimer = null;
    this.moveSpeed = 50;

    // Remove mini health bar
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
  }

  activateBoss() {
    if (this.bossActive || this.isDead) return;
    this.bossActive = true;
    soundFX.playBossRoar();
    this.scene.events.emit('boss_activated', {
      name: this.bossName,
      health: this.health,
      maxHealth: this.maxHealth,
    });
    this.scene.events.emit('show_toast', '⚠️ IGNIS AWAKENS — OBSIDIAN COLOSSUS OF THE GREAT ANVIL!');
    this.scheduleNextAction(1800);
  }

  update(player) {
    if (!this.bossActive || this.isDead) return;

    if (!this.isAttacking) {
      this.setFlipX(player.x > this.x);

      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist > 80 && dist < 450) {
        const dir = player.x < this.x ? -1 : 1;
        this.body.setVelocityX(dir * this.moveSpeed);
      } else {
        this.body.setVelocityX(0);
      }
    }
  }

  scheduleNextAction(delay = 2400) {
    if (!this.bossActive || this.isDead) return;
    if (this.actionTimer) this.actionTimer.remove();

    this.actionTimer = this.scene.time.delayedCall(delay, () => {
      this.performRandomAttack();
    });
  }

  performRandomAttack() {
    if (!this.bossActive || this.isDead) return;
    const roll = Math.random();

    if (roll < 0.6) {
      this.performAnvilSlam();
    } else {
      this.eruptMagmaGeysers();
    }
  }

  performAnvilSlam() {
    this.isAttacking = true;
    this.body.setVelocityX(0);
    this.setTexture('boss_ignis_slam');

    soundFX.playAstralRay();
    this.scene.createMagicBurst(this.x, this.y - 30, 0xf97316);

    this.scene.time.delayedCall(800, () => {
      if (this.isDead) return;

      soundFX.playHit(true);
      this.scene.cameras.main.shake(250, 0.018);

      // Create dual rolling lava shockwaves (left and right)
      [-1, 1].forEach((dir) => {
        const wave = this.scene.bossShockwaves.create(this.x + dir * 30, this.y + 36, 'spark');
        wave.setScale(2.5).setTint(0xea580c);
        wave.body.setAllowGravity(false);
        wave.body.setVelocityX(dir * 240);
        wave.damage = 20;

        this.scene.tweens.add({
          targets: wave,
          alpha: 0,
          duration: 1000,
          onComplete: () => wave.destroy(),
        });
      });

      this.scene.time.delayedCall(500, () => {
        if (!this.isDead) this.setTexture('boss_ignis_idle');
        this.isAttacking = false;
        this.scheduleNextAction(2200);
      });
    });
  }

  eruptMagmaGeysers() {
    this.isAttacking = true;
    this.body.setVelocityX(0);

    soundFX.playBossRoar();
    this.scene.events.emit('show_toast', '🔥 MAGMA GEYSERS ERUPTING ACROSS THE FORGE FLOOR!');

    const player = this.scene.player;
    const targetX = player ? player.x : this.x + 150;

    // Warning marker on floor
    const warning = this.scene.add.circle(targetX, this.y + 40, 24, 0xef4444, 0.4);
    this.scene.tweens.add({
      targets: warning,
      scale: 1.5,
      alpha: 0.9,
      duration: 600,
      yoyo: true,
      repeat: 1,
    });

    this.scene.time.delayedCall(1200, () => {
      warning.destroy();
      if (this.isDead) return;

      // Vertical fire geyser erupting upward
      const geyser = this.scene.bossShockwaves.create(targetX, this.y + 20, 'spark');
      geyser.setScale(4.0).setTint(0xf97316);
      geyser.body.setAllowGravity(false);
      geyser.body.setVelocityY(-350);
      geyser.damage = 22;

      soundFX.playHit(true);

      this.scene.tweens.add({
        targets: geyser,
        alpha: 0,
        duration: 800,
        onComplete: () => geyser.destroy(),
      });

      this.isAttacking = false;
      this.scheduleNextAction(2000);
    });
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;

    if (!this.bossActive) {
      this.activateBoss();
    }

    // Heavy strikes break armor
    const isHeavy = amount >= 35;
    let actualDmg = isHeavy ? Math.round(amount * 1.25) : amount;

    if (isHeavy) {
      this.scene.createDamageNumber(this.x, this.y - 30, 'ARMOR SHATTER!', '#f97316');
      soundFX.playWallShatter();
    }

    this.health -= actualDmg;
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);

    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead) this.clearTint();
    });

    soundFX.playHit(isHeavy);
    this.scene.createDamageNumber(this.x, this.y - 20, actualDmg, isHeavy ? '#facc15' : '#ffffff');

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.bossActive = false;
    if (this.actionTimer) this.actionTimer.remove();
    this.body.setVelocity(0, 0);
    this.body.enable = false;

    soundFX.playBossRoar();
    this.scene.cameras.main.shake(400, 0.02);
    this.scene.createMagicBurst(this.x, this.y, 0xf97316);
    this.scene.createMagicBurst(this.x, this.y, 0xef4444);

    // Drop abundant Soul Orbs
    this.scene.spawnSoulOrbs(this.x, this.y, 8);

    // Spawn Primordial Sigil of the Forge
    this.scene.spawnPrimordialSigil('sigil_forge', this.x, this.y - 10);

    this.scene.events.emit('boss_health_changed', 0, this.maxHealth);
    this.scene.events.emit('show_toast', '🏆 IGNIS CRUMBLES — THE OBSIDIAN FORGE IS PURIFIED!');

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.1,
      duration: 1200,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}

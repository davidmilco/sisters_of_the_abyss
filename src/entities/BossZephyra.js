import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class BossZephyra extends Enemy {
  constructor(scene, x, y) {
    // 380 Max Health for Spire Tempest Queen
    super(scene, x, y, 'boss_zephyra_idle', 380, 20);

    this.body.setSize(44, 56);
    this.body.setOffset(16, 10);
    this.body.setAllowGravity(false);
    this.setCollideWorldBounds(true);

    this.bossName = 'ZEPHYRA, QUEEN OF THE TEMPEST';
    this.bossActive = false;
    this.isAttacking = false;
    this.isDiving = false;
    this.actionTimer = null;
    this.hoverTween = null;
    this.homeY = y;

    // Remove mini health bar
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();

    this.startFlightHover();
  }

  startFlightHover() {
    this.hoverTween = this.scene.tweens.add({
      targets: this,
      y: this.homeY - 24,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
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
    this.scene.events.emit('show_toast', '⚠️ ZEPHYRA AWAKENS — AERIAL SOVEREIGN OF THE HOWLING SPIRE!');
    this.scheduleNextAction(1600);
  }

  update(player) {
    if (!this.bossActive || this.isDead) return;

    if (!this.isAttacking) {
      this.setFlipX(player.x > this.x);

      // Glide horizontally to keep range
      const targetX = player.x + (this.flipX ? -140 : 140);
      const dx = targetX - this.x;
      this.body.setVelocityX(dx * 1.5);
    }
  }

  scheduleNextAction(delay = 2200) {
    if (!this.bossActive || this.isDead) return;
    if (this.actionTimer) this.actionTimer.remove();

    this.actionTimer = this.scene.time.delayedCall(delay, () => {
      this.performRandomAttack();
    });
  }

  performRandomAttack() {
    if (!this.bossActive || this.isDead) return;
    const roll = Math.random();

    if (roll < 0.55) {
      this.performTalonDive();
    } else {
      this.performGaleWhirlwind();
    }
  }

  performTalonDive() {
    this.isAttacking = true;
    this.isDiving = true;
    if (this.hoverTween) this.hoverTween.pause();

    const player = this.scene.player;
    if (!player) return;

    const targetX = player.x;
    const targetY = player.y;

    this.setTexture('boss_zephyra_dive');
    soundFX.playDash();

    // High speed dive bomb towards player
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const speed = 420;
    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.scene.time.delayedCall(600, () => {
      if (this.isDead) return;

      // Impact on platform: Talon stuck briefly (punish window for player!)
      this.body.setVelocity(0, 0);
      soundFX.playHit(true);
      this.scene.cameras.main.shake(180, 0.012);
      this.scene.createMagicBurst(this.x, this.y + 20, 0x38bdf8);
      this.setTexture('boss_zephyra_idle');

      // Stuck for 1 second where player can strike!
      this.scene.time.delayedCall(1000, () => {
        if (this.isDead) return;

        // Ascend back to sky
        this.scene.tweens.add({
          targets: this,
          y: this.homeY,
          duration: 600,
          ease: 'Sine.easeOut',
          onComplete: () => {
            if (this.hoverTween) this.hoverTween.resume();
            this.isAttacking = false;
            this.isDiving = false;
            this.scheduleNextAction(2000);
          },
        });
      });
    });
  }

  performGaleWhirlwind() {
    this.isAttacking = true;
    soundFX.playAstralRay();

    // Spawn 2 gale wind vortexes
    [-1, 1].forEach((dir) => {
      const gust = this.scene.enemyEmbers.create(this.x + dir * 20, this.y, 'spark');
      gust.setScale(2.5).setTint(0x38bdf8);
      gust.body.setAllowGravity(false);
      gust.body.setVelocityX(dir * 220);
      gust.damage = 16;

      this.scene.tweens.add({
        targets: gust,
        alpha: 0,
        duration: 1200,
        onComplete: () => gust.destroy(),
      });
    });

    this.scene.time.delayedCall(500, () => {
      this.isAttacking = false;
      this.scheduleNextAction(2200);
    });
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;

    if (!this.bossActive) {
      this.activateBoss();
    }

    this.health -= amount;
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);

    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead) this.clearTint();
    });

    soundFX.playHit(amount >= 30);
    this.scene.createDamageNumber(this.x, this.y - 20, amount, amount >= 30 ? '#facc15' : '#ffffff');

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.bossActive = false;
    if (this.actionTimer) this.actionTimer.remove();
    if (this.hoverTween) this.hoverTween.stop();

    this.body.setVelocity(0, 0);
    this.body.enable = false;

    soundFX.playBossRoar();
    this.scene.cameras.main.shake(400, 0.02);
    this.scene.createMagicBurst(this.x, this.y, 0x38bdf8);
    this.scene.createMagicBurst(this.x, this.y, 0xc084fc);

    // Drop abundant Soul Orbs
    this.scene.spawnSoulOrbs(this.x, this.y, 8);

    // Spawn Primordial Sigil of the Gale
    this.scene.spawnPrimordialSigil('sigil_gale', this.x, this.y - 10);

    this.scene.events.emit('boss_health_changed', 0, this.maxHealth);
    this.scene.events.emit('show_toast', '🏆 ZEPHYRA FELLED — THE TEMPEST CROWN IS CALM!');

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.1,
      duration: 1200,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}

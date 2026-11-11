import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class BossCaelith extends Enemy {
  constructor(scene, x, y) {
    // 350 Max Health for Grotto Regional Boss
    super(scene, x, y, 'boss_caelith_idle', 350, 16);

    this.body.setSize(38, 64);
    this.body.setOffset(13, 6);
    this.body.setAllowGravity(false);
    this.setCollideWorldBounds(true);

    this.bossName = 'CAELITH, THE PRISMATIC WEAVER';
    this.bossActive = false;
    this.isAttacking = false;
    this.barrierActive = false;
    this.barrierHp = 0;
    this.actionTimer = null;
    this.hoverTween = null;

    // Teleportation node anchor points in the Weaver Sanctum
    this.nodes = [
      { x: 1520, y: 180 },
      { x: 1720, y: 130 },
      { x: 1920, y: 180 },
      { x: 1720, y: 240 },
    ];
    this.currentNodeIndex = 1;

    // Remove mini health bar
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();

    // Start gentle hover motion
    this.startHoverAnimation();
  }

  startHoverAnimation() {
    this.hoverTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 12,
      duration: 1400,
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
    this.scene.events.emit('show_toast', '⚠️ CAELITH AWAKENS — ASTRAL WEAVER OF HARD-LIGHT BARRIERS!');
    this.scheduleNextAction(1500);
  }

  update(player) {
    if (!this.bossActive || this.isDead) return;

    if (!this.isAttacking) {
      this.setFlipX(player.x > this.x);
    }
  }

  scheduleNextAction(delay = 2000) {
    if (!this.bossActive || this.isDead) return;
    if (this.actionTimer) this.actionTimer.remove();

    this.actionTimer = this.scene.time.delayedCall(delay, () => {
      this.performRandomAction();
    });
  }

  performRandomAction() {
    if (!this.bossActive || this.isDead) return;
    const roll = Math.random();

    if (roll < 0.4) {
      this.teleportToRandomNode();
    } else if (roll < 0.75) {
      this.firePrismaticLasers();
    } else {
      this.summonStarlightBarrier();
    }
  }

  teleportToRandomNode() {
    let nextIndex;
    do {
      nextIndex = Phaser.Math.Between(0, this.nodes.length - 1);
    } while (nextIndex === this.currentNodeIndex);

    this.currentNodeIndex = nextIndex;
    const target = this.nodes[nextIndex];

    // Star flash disappear
    soundFX.playAstralRay();
    this.scene.createMagicBurst(this.x, this.y, 0x22d3ee);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.2,
      duration: 250,
      onComplete: () => {
        if (this.isDead) return;
        this.setPosition(target.x, target.y);
        this.scene.createMagicBurst(target.x, target.y, 0xa855f7);

        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          scale: 1,
          duration: 300,
          onComplete: () => {
            this.scheduleNextAction(1200);
          },
        });
      },
    });
  }

  firePrismaticLasers() {
    this.isAttacking = true;
    this.setTexture('boss_caelith_cast');
    soundFX.playAstralRay();

    // Visual charging star flare
    const flare = this.scene.add.circle(this.x, this.y - 10, 16, 0x67e8f9, 0.8);
    this.scene.tweens.add({
      targets: flare,
      scale: 2.2,
      alpha: 0,
      duration: 600,
      onComplete: () => flare.destroy(),
    });

    this.scene.time.delayedCall(600, () => {
      if (this.isDead) return;

      const player = this.scene.player;
      if (!player) return;

      // Fire 3 fan lasers towards player
      const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const angles = [baseAngle - 0.28, baseAngle, baseAngle + 0.28];

      angles.forEach((ang) => {
        const bolt = this.scene.enemyEmbers.create(this.x, this.y, 'spark');
        bolt.setScale(2.0).setTint(0x22d3ee);
        bolt.body.setAllowGravity(false);
        const speed = 260;
        bolt.body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
        bolt.damage = 16;

        this.scene.tweens.add({
          targets: bolt,
          alpha: 0,
          duration: 1800,
          onComplete: () => bolt.destroy(),
        });
      });

      this.scene.time.delayedCall(400, () => {
        if (!this.isDead) this.setTexture('boss_caelith_idle');
        this.isAttacking = false;
        this.scheduleNextAction(2000);
      });
    });
  }

  summonStarlightBarrier() {
    if (this.barrierActive) {
      this.firePrismaticLasers();
      return;
    }

    this.barrierActive = true;
    this.barrierHp = 60;
    soundFX.playShieldBash();

    this.barrierSprite = this.scene.add.circle(this.x, this.y, 42, 0x22d3ee, 0.35);
    this.barrierSprite.setStrokeStyle(2.5, 0x67e8f9);

    this.scene.events.emit('show_toast', '✨ CAELITH WEAVES A HARD-LIGHT PRISM BARRIER!');

    this.scene.tweens.add({
      targets: this.barrierSprite,
      scale: 1.15,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    this.scheduleNextAction(2200);
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;

    if (!this.bossActive) {
      this.activateBoss();
    }

    // Barrier absorb mechanics
    if (this.barrierActive) {
      this.barrierHp -= amount;
      soundFX.playParry();
      this.scene.createDamageNumber(this.x, this.y - 30, 'ABSORBED', '#22d3ee');
      this.scene.createMagicBurst(this.x, this.y, 0x22d3ee);

      if (this.barrierHp <= 0) {
        this.barrierActive = false;
        if (this.barrierSprite) {
          this.barrierSprite.destroy();
          this.barrierSprite = null;
        }
        soundFX.playWallShatter();
        this.scene.createMagicBurst(this.x, this.y, 0xffffff);
        this.scene.createDamageNumber(this.x, this.y - 35, 'BARRIER SHATTERED!', '#fbbf24');
      }
      return;
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
    if (this.barrierSprite) this.barrierSprite.destroy();

    this.body.setVelocity(0, 0);
    this.body.enable = false;

    soundFX.playBossRoar();
    this.scene.cameras.main.shake(400, 0.02);
    this.scene.createMagicBurst(this.x, this.y, 0x22d3ee);
    this.scene.createMagicBurst(this.x, this.y, 0xa855f7);

    // Drop abundant Soul Orbs
    this.scene.spawnSoulOrbs(this.x, this.y, 8);

    // Spawn Primordial Sigil of the Prism
    this.scene.spawnPrimordialSigil('sigil_prism', this.x, this.y - 10);

    this.scene.events.emit('boss_health_changed', 0, this.maxHealth);
    this.scene.events.emit('show_toast', '🏆 CAELITH DEFEATED — THE CELESTIAL GROTTO SHINES BRIGHT!');

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

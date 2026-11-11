import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { SkeletonKnight } from './SkeletonKnight.js';
import { soundFX } from '../audio/SoundFX.js';

export class BossOssian extends Enemy {
  constructor(scene, x, y) {
    // 320 Max Health for Regional Guardian Battle
    super(scene, x, y, 'boss_ossian_idle', 320, 18);

    this.body.setSize(44, 76);
    this.body.setOffset(14, 10);
    this.setCollideWorldBounds(true);

    this.bossName = 'OSSIAN, THE CRYPT WARDEN';
    this.bossActive = false;
    this.isAttacking = false;
    this.isStunned = false;
    this.shieldRaised = true;
    this.actionTimer = null;
    this.moveSpeed = 65;
    this.phalanxSummoned = false;

    // Use boss HUD health bar
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
    this.scene.events.emit('show_toast', '⚠️ OSSIAN AWAKENS — TOWER SHIELD DEFLECTS FRONTAL ATTACKS!');
    this.scheduleNextAction(1800);
  }

  update(player) {
    if (!this.bossActive || this.isDead) return;

    if (this.isStunned) {
      this.body.setVelocityX(0);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const facingPlayer = (player.x < this.x && this.flipX === false) || (player.x > this.x && this.flipX === true);

    // Keep facing player when not attacking
    if (!this.isAttacking) {
      this.setFlipX(player.x > this.x);
    }

    // Phase 2 Phalanx summon at <= 50% health
    if (!this.phalanxSummoned && this.health <= this.maxHealth * 0.5) {
      this.phalanxSummoned = true;
      this.summonPhalanx();
    }

    // Passive advance towards player if not in melee range
    if (!this.isAttacking && dist > 70 && dist < 500) {
      const dir = player.x < this.x ? -1 : 1;
      this.body.setVelocityX(dir * this.moveSpeed);
    } else if (!this.isAttacking) {
      this.body.setVelocityX(0);
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
    if (!this.bossActive || this.isDead || this.isStunned) return;
    const player = this.scene.player;
    if (!player) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const roll = Math.random();

    if (dist < 110 || roll < 0.5) {
      this.performHammerSlam();
    } else {
      this.performShieldRush();
    }
  }

  performHammerSlam() {
    this.isAttacking = true;
    this.body.setVelocityX(0);
    this.setTexture('boss_ossian_attack');

    // Telegraph charge
    soundFX.playAstralRay();
    this.scene.createMagicBurst(this.x, this.y - 30, 0x38bdf8);

    this.scene.time.delayedCall(700, () => {
      if (this.isDead || this.isStunned) return;

      soundFX.playHit(true);
      this.scene.cameras.main.shake(180, 0.012);

      // Create hammer impact shockwave along floor
      const dir = this.flipX ? 1 : -1;
      const waveX = this.x + dir * 30;
      const waveY = this.y + 28;

      const shockwave = this.scene.bossShockwaves.create(waveX, waveY, 'spark');
      shockwave.setScale(2.5).setTint(0x38bdf8);
      shockwave.body.setAllowGravity(false);
      shockwave.body.setVelocityX(dir * 280);
      shockwave.damage = 18;

      this.scene.tweens.add({
        targets: shockwave,
        alpha: 0,
        duration: 900,
        onComplete: () => shockwave.destroy(),
      });

      this.scene.time.delayedCall(450, () => {
        if (!this.isDead && !this.isStunned) {
          this.setTexture('boss_ossian_idle');
        }
        this.isAttacking = false;
        this.scheduleNextAction(2000);
      });
    });
  }

  performShieldRush() {
    this.isAttacking = true;
    const dir = this.flipX ? 1 : -1;
    this.body.setVelocityX(dir * 240);

    soundFX.playDash();

    // Dash trail
    const rushTimer = this.scene.time.addEvent({
      delay: 60,
      repeat: 6,
      callback: () => {
        if (this.scene) {
          const ghost = this.scene.add.image(this.x, this.y, 'boss_ossian_idle')
            .setFlipX(this.flipX)
            .setAlpha(0.4)
            .setTint(0x94a3b8);
          this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 250,
            onComplete: () => ghost.destroy(),
          });
        }
      },
    });

    this.scene.time.delayedCall(500, () => {
      this.body.setVelocityX(0);
      this.isAttacking = false;
      this.scheduleNextAction(2200);
    });
  }

  summonPhalanx() {
    soundFX.playBossRoar();
    this.scene.events.emit('show_toast', '🛡️ OSSIAN CALLS FORTH THE PHALANX GUARDS!');
    this.scene.cameras.main.shake(200, 0.01);

    [-80, 80].forEach((ox) => {
      const skel = new SkeletonKnight(this.scene, this.x + ox, this.y);
      this.scene.enemies.add(skel);
      this.scene.createMagicBurst(this.x + ox, this.y, 0x38bdf8);
    });
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;

    if (!this.bossActive) {
      this.activateBoss();
    }

    // Frontal attack check: Ossian's tower shield deflects frontal basic strikes!
    // Facing left: sourceX < this.x is frontal.
    // Facing right: sourceX > this.x is frontal.
    const isFrontal = (sourceX < this.x && !this.flipX) || (sourceX > this.x && this.flipX);

    // Aegis Bash (Percy's shield charge) or heavy strike breaks the guard!
    const isHeavyBreaker = amount >= 35;

    if (isFrontal && !isHeavyBreaker && !this.isStunned) {
      // Deflected by Tower Shield!
      soundFX.playParry();
      this.scene.createDamageNumber(this.x, this.y - 30, 'DEFLECTED', '#94a3b8');

      // Spark flash on shield
      const sx = this.flipX ? this.x + 24 : this.x - 24;
      this.scene.createMagicBurst(sx, this.y, 0xffffff);
      return;
    }

    // Successful hit!
    if (isHeavyBreaker && isFrontal) {
      // Guard broken! Stagger Ossian for 1.2 seconds
      this.isStunned = true;
      this.body.setVelocityX(0);
      soundFX.playHit(true);
      this.scene.createDamageNumber(this.x, this.y - 35, 'GUARD BROKEN!', '#fbbf24');
      this.setTint(0xfbbf24);

      this.scene.time.delayedCall(1200, () => {
        if (!this.isDead) {
          this.isStunned = false;
          this.clearTint();
          this.scheduleNextAction(1000);
        }
      });
    }

    this.health -= amount;
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);

    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead && !this.isStunned) this.clearTint();
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
    this.body.setVelocity(0, 0);
    this.body.enable = false;

    soundFX.playBossRoar();
    this.scene.cameras.main.shake(400, 0.02);
    this.scene.createMagicBurst(this.x, this.y, 0x38bdf8);

    // Drop abundant Soul Orbs
    this.scene.spawnSoulOrbs(this.x, this.y, 8);

    // Spawn Primordial Sigil of the Crypt
    this.scene.spawnPrimordialSigil('sigil_crypt', this.x, this.y - 10);

    this.scene.events.emit('boss_health_changed', 0, this.maxHealth);
    this.scene.events.emit('show_toast', '🏆 OSSIAN DEFEATED — THE CRYPT VIADUCT IS OPEN!');

    // Open any adjacent locked crypt gates
    if (this.scene.cryptWardenGate) {
      this.scene.tweens.add({
        targets: this.scene.cryptWardenGate,
        y: this.scene.cryptWardenGate.y - 96,
        alpha: 0.3,
        duration: 1000,
        onComplete: () => {
          if (this.scene.cryptWardenGate.body) {
            this.scene.cryptWardenGate.body.enable = false;
          }
        },
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.2,
      duration: 1200,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}

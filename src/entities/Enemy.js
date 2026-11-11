import Phaser from 'phaser';
import { soundFX } from '../audio/SoundFX.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, maxHealth = 50, damage = 15) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.damage = damage;
    this.isDead = false;
    this.isHurt = false;
    this.aggroRange = 240;

    // Phase 7: Juggle, Stagger, Freeze & Execution Finishers
    this.isJuggleSuspended = false;
    this.isStaggered = false;
    this.isFrozen = false;
    this.staggerTimer = null;
    this.freezeTimer = null;
    this.executeBeacon = null;

    // Mini floating health bar above enemy
    this.healthBarBg = scene.add.rectangle(x, y - 28, 32, 4, 0x1f2937);
    this.healthBar = scene.add.rectangle(x - 16, y - 28, 32, 4, 0xef4444);
    this.healthBar.setOrigin(0, 0.5);
    this.healthBarBg.setVisible(false);
    this.healthBar.setVisible(false);
  }

  updateHealthBar() {
    if (this.isDead) return;
    this.healthBarBg.setPosition(this.x, this.y - 32);
    this.healthBar.setPosition(this.x - 16, this.y - 32);
    const pct = Math.max(0, this.health / this.maxHealth);
    this.healthBar.displayWidth = 32 * pct;
    this.healthBarBg.setVisible(true);
    this.healthBar.setVisible(true);
  }

  takeDamage(amount, sourceX) {
    if (this.isDead) return;

    this.health -= amount;
    this.isHurt = true;

    // Visual flash white/red
    this.setTint(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (!this.isDead) this.clearTint();
    });

    // Knockback
    const dir = sourceX ? (this.x < sourceX ? -1 : 1) : 1;
    this.body.setVelocityX(dir * 180);
    this.body.setVelocityY(-120);

    // Hit sounds & numbers
    soundFX.playHit(amount >= 35);
    this.scene.createDamageNumber(this.x, this.y - 20, amount, amount >= 35 ? '#facc15' : '#ffffff');
    this.updateHealthBar();

    if (this.health <= 0) {
      this.die();
    } else {
      // Phase 7: Automatically stagger low-health enemies (HP <= 25%) for execution finisher
      if (this.health <= this.maxHealth * 0.28 && !this.isStaggered && !this.isDead) {
        this.stagger(4500);
      }

      this.scene.time.delayedCall(220, () => {
        this.isHurt = false;
      });
    }
  }

  // =========================================================================
  // PHASE 7: HACK-AND-SLASH COMBAT PHYSICS & FINISHERS
  // =========================================================================
  launchAirborne(velocityY = -450, velocityX = 0) {
    if (this.isDead || !this.body) return;
    this.body.setVelocityY(velocityY);
    this.body.setVelocityX(velocityX);
    this.isJuggleSuspended = true;

    // Temporary airborne float physics for juggling
    this.scene.tweens.add({
      targets: this,
      angle: velocityX > 0 ? 12 : -12,
      duration: 250,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    this.scene.time.delayedCall(650, () => {
      this.isJuggleSuspended = false;
      this.setAngle(0);
    });
  }

  stagger(duration = 4000) {
    if (this.isDead || this.isStaggered) return;
    this.isStaggered = true;
    if (this.body) this.body.setVelocityX(0);

    // Flashing execute beacon above enemy
    if (!this.executeBeacon) {
      this.executeBeacon = this.scene.add.text(this.x, this.y - 48, '💀 [E / B] EXECUTE', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f87171',
        stroke: '#000000',
        strokeThickness: 3,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(150);

      this.scene.tweens.add({
        targets: this.executeBeacon,
        scale: 1.15,
        duration: 350,
        yoyo: true,
        repeat: -1,
      });
    }

    if (this.staggerTimer) this.staggerTimer.remove();
    this.staggerTimer = this.scene.time.delayedCall(duration, () => {
      this.clearStagger();
    });
  }

  clearStagger() {
    this.isStaggered = false;
    if (this.executeBeacon) {
      this.executeBeacon.destroy();
      this.executeBeacon = null;
    }
    if (this.staggerTimer) {
      this.staggerTimer.remove();
      this.staggerTimer = null;
    }
  }

  freeze(duration = 2500) {
    if (this.isDead || !this.body) return;
    this.isFrozen = true;
    this.body.setVelocity(0, 0);
    this.setTint(0x67e8f9);

    if (this.freezeTimer) this.freezeTimer.remove();
    this.freezeTimer = this.scene.time.delayedCall(duration, () => {
      this.unfreeze();
    });
  }

  unfreeze() {
    this.isFrozen = false;
    if (!this.isDead) this.clearTint();
    if (this.freezeTimer) {
      this.freezeTimer.remove();
      this.freezeTimer = null;
    }
  }

  takeExecutionFinisher() {
    if (this.isDead) return;
    this.clearStagger();
    this.health = 0;

    // Guaranteed execution rewards: healing orb (+25 HP) + 4 Soul Orbs
    if (this.scene.player) {
      this.scene.player.heal(25);
    }
    this.scene.spawnSoulOrbs(this.x, this.y, 4);
    this.die();
  }

  die() {
    this.isDead = true;
    this.clearStagger();
    this.unfreeze();
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();

    // Death fade & particle burst
    this.scene.createMagicBurst(this.x, this.y, 0xef4444);

    // Drop Soul Orbs for player
    this.scene.spawnSoulOrbs(this.x, this.y, 2);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.2,
      duration: 350,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.isDead && this.healthBarBg && this.healthBarBg.visible) {
      this.healthBarBg.setPosition(this.x, this.y - 32);
      this.healthBar.setPosition(this.x - 16, this.y - 32);
    }
    if (!this.isDead && this.executeBeacon) {
      this.executeBeacon.setPosition(this.x, this.y - 48);
    }
  }
}

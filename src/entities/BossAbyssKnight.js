import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { soundFX } from '../audio/SoundFX.js';

export class BossAbyssKnight extends Enemy {
  constructor(scene, x, y) {
    // 600 Max Health for 3-Phase Climax Battle
    super(scene, x, y, 'boss_idle_0', 600, 24);

    this.body.setSize(46, 82);
    this.body.setOffset(25, 14);
    this.setCollideWorldBounds(true);

    this.bossActive = false;
    this.phase = 1;
    this.isAttacking = false;
    this.isStunned = false;
    this.isLunging = false;
    this.isLevitating = false;
    this.barrierActive = false;
    this.barrierSprite = null;
    this.actionTimer = null;
    this.meteorEvent = null;
    this.moveSpeed = 85;

    // Remove the default mini health bar (the boss uses the grand cinematic HUD bar)
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
  }

  activateBoss() {
    if (this.bossActive) return;
    this.bossActive = true;
    soundFX.playBossRoar();
    this.scene.events.emit('boss_activated', {
      name: 'MALAKOR UNBOUND, LORD OF THE VOID',
      health: this.health,
      maxHealth: this.maxHealth,
    });

    this.scene.events.emit('show_toast', '⚠️ MALAKOR AWAKENS — PHASE 1: HEAVY VOID STRIKES!');
    this.scheduleNextAction(1500);
  }

  update(player) {
    if (!this.bossActive || this.isDead) return;

    // Keep barrier sprite positioned on Malakor if active
    if (this.barrierSprite && this.barrierSprite.active) {
      this.barrierSprite.setPosition(this.x, this.y);
      this.barrierSprite.setRotation(this.scene.time.now * 0.002);
    }

    if (this.isStunned) {
      this.setTexture('boss_stunned');
      this.body.setVelocity(0, 0);
      return;
    }

    // Phase 2 transition check (HP <= 400)
    if (this.phase === 1 && this.health <= 400) {
      this.enterPhase2();
      return;
    }

    // Phase 3 transition check (HP <= 200)
    if (this.phase === 2 && this.health <= 200) {
      this.enterPhase3();
      return;
    }

    // Facing direction
    const dx = player.x - this.x;
    if (!this.isAttacking) {
      this.setFlipX(dx < 0);
    }

    // Phase 2 levitation floating behavior
    if (this.isLevitating) {
      this.setTexture('boss_levitate');
      const hoverY = 1420 + Math.sin(this.scene.time.now * 0.003) * 16;
      this.y = hoverY;
      // Menacing drift in the sky
      const targetSkyX = Phaser.Math.Clamp(player.x, 4650, 5150);
      const skyDx = targetSkyX - this.x;
      if (Math.abs(skyDx) > 20) {
        this.body.setVelocityX(skyDx > 0 ? 55 : -55);
      } else {
        this.body.setVelocityX(0);
      }
      return;
    }

    // Grounded navigation
    if (!this.isAttacking) {
      const animFrame = Math.floor((this.scene.time.now / 350) % 2);
      this.setTexture(`boss_idle_${animFrame}`);

      // Approach player within Sanctum bounds (x: 4520 to 5280)
      if (Math.abs(dx) > 65) {
        if (dx > 0 && this.x < 5280) {
          this.body.setVelocityX(this.moveSpeed);
        } else if (dx < 0 && this.x > 4520) {
          this.body.setVelocityX(-this.moveSpeed);
        } else {
          this.body.setVelocityX(0);
        }
      } else {
        this.body.setVelocityX(0);
      }
    }
  }

  // --- PHASE TRANSITIONS ---

  enterPhase2() {
    this.phase = 2;
    this.isAttacking = false;
    this.isLunging = false;
    if (this.actionTimer) this.actionTimer.remove();

    soundFX.playBossPhaseTransition();
    soundFX.playBossRoar();
    this.scene.cameras.main.shake(320, 0.018);
    this.scene.createMagicBurst(this.x, this.y, 0x8b5cf6);

    this.scene.events.emit('show_toast', '⚡ PHASE 2: AERIAL VOID STORM — VAULT WITH TILLY & WREN!');

    // Ascend into the sky
    this.body.setAllowGravity(false);
    this.isLevitating = true;
    this.setTexture('boss_levitate');

    this.scene.tweens.add({
      targets: this,
      y: 1420,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.startVoidStorm();
      },
    });
  }

  startVoidStorm() {
    if (this.isDead || this.phase !== 2) return;

    soundFX.playVoidStorm();

    // Recurring meteor storm
    this.meteorEvent = this.scene.time.addEvent({
      delay: 1400,
      repeat: -1,
      callback: () => {
        if (this.isDead || this.phase !== 2 || !this.isLevitating) return;
        this.spawnVoidMeteor();
      },
    });

    // Action timer during levitation: teleport drop attempts
    this.scheduleNextAction(4500);
  }

  spawnVoidMeteor() {
    if (!this.scene || !this.scene.enemyEmbers) return;

    soundFX.playVoidStorm();
    const spawnX = Phaser.Math.Between(4540, 5260);
    const meteor = this.scene.enemyEmbers.create(spawnX, 1160, 'void_meteor');
    meteor.body.setAllowGravity(false);
    meteor.body.setVelocity(Phaser.Math.Between(-30, 30), 240);

    // Trails & impact
    this.scene.time.delayedCall(2200, () => {
      if (meteor && meteor.active) {
        this.scene.createMagicBurst(meteor.x, meteor.y, 0xa855f7);
        meteor.destroy();
      }
    });
  }

  knockDownFromSky() {
    if (!this.isLevitating) return;

    this.isLevitating = false;
    this.body.setAllowGravity(true);
    if (this.meteorEvent) this.meteorEvent.remove();

    soundFX.playExplosion();
    this.scene.cameras.main.shake(250, 0.015);
    this.scene.createMagicBurst(this.x, this.y, 0x38bdf8);
    this.scene.createDamageNumber(this.x, this.y - 30, 'AERIAL STRIKE! -40', '#38bdf8');

    this.health = Math.max(1, this.health - 40);
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);
    this.scene.events.emit('show_toast', '💥 AERIAL KNOCKDOWN! MALAKOR IS CRASHED & GROUNDED!');

    // Slam to ground
    this.body.setVelocityY(420);

    this.scene.time.delayedCall(450, () => {
      this.stun(2400);
      this.scheduleNextAction(3200);
    });
  }

  enterPhase3() {
    this.phase = 3;
    this.isLevitating = false;
    this.body.setAllowGravity(true);
    if (this.meteorEvent) this.meteorEvent.remove();
    if (this.actionTimer) this.actionTimer.remove();

    soundFX.playBossPhaseTransition();
    soundFX.playBossRoar();
    this.scene.cameras.main.shake(400, 0.022);
    this.scene.createMagicBurst(this.x, this.y, 0x06b6d4);

    this.scene.events.emit('show_toast', '🔮 PHASE 3: MALAKOR UNBOUND — SHATTER ASTRAL AEGIS WITH MONA!');

    // Encase in impenetrable Astral Void Aegis
    this.barrierActive = true;
    this.barrierSprite = this.scene.add.image(this.x, this.y, 'boss_astral_barrier').setDepth(15);
    this.scene.tweens.add({
      targets: this.barrierSprite,
      scale: 1.15,
      alpha: 0.85,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.moveSpeed = 145; // Rapid aggressive movement
    this.scheduleNextAction(1200);
  }

  shatterBarrier() {
    if (!this.barrierActive) return;

    this.barrierActive = false;
    soundFX.playBarrierShatter();
    this.scene.cameras.main.shake(320, 0.02);

    if (this.barrierSprite) {
      this.scene.tweens.add({
        targets: this.barrierSprite,
        scale: 1.8,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.barrierSprite) this.barrierSprite.destroy();
          this.barrierSprite = null;
        },
      });
    }

    this.scene.createMagicBurst(this.x, this.y, 0x22d3ee);
    this.scene.createDamageNumber(this.x, this.y - 45, 'AEGIS SHATTERED! +60 DMG', '#22d3ee');

    this.health = Math.max(1, this.health - 60);
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);
    this.scene.events.emit('show_toast', "✨ MONA'S ASTRAL RAY SHATTERED MALAKOR'S AEGIS!");

    this.stun(2800);
  }

  stun(duration = 2000) {
    this.isStunned = true;
    this.isAttacking = false;
    this.isLunging = false;
    this.setTexture('boss_stunned');
    this.body.setVelocity(0, 0);

    this.scene.time.delayedCall(duration, () => {
      if (this.isDead) return;
      this.isStunned = false;
      this.setTexture('boss_idle_0');
      this.scheduleNextAction(1000);
    });
  }

  deflectLunge() {
    if (!this.isLunging) return;

    this.isLunging = false;
    soundFX.playShieldDeflect();
    this.scene.cameras.main.shake(250, 0.016);

    const dir = this.flipX ? 1 : -1;
    this.body.setVelocityX(dir * 280);

    this.scene.createMagicBurst(this.x, this.y, 0xf59e0b);
    this.scene.createDamageNumber(this.x, this.y - 45, 'PERCY DEFLECT! +50 DMG', '#fbbf24');

    this.health = Math.max(1, this.health - 50);
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);
    this.scene.events.emit('show_toast', "🛡️ PERCY'S SHIELD DEFLECTED MALAKOR'S CLEAVE!");

    this.stun(2200);
  }

  scheduleNextAction(delay = 2000) {
    if (this.isDead || !this.bossActive) return;

    const cooldown = this.phase === 3 ? 1200 : (this.phase === 2 ? 1800 : delay);

    this.actionTimer = this.scene.time.delayedCall(cooldown, () => {
      if (this.isDead || !this.bossActive || this.isStunned) return;
      this.chooseAttack();
    });
  }

  chooseAttack() {
    if (this.isLevitating) {
      // In air: swoop down or drop shockwave
      this.attackSwoop();
      return;
    }

    const attacks = this.phase === 3 ?
      ['slam', 'cleave', 'teleport', 'teleport'] :
      ['slam', 'cleave', 'teleport'];

    const chosen = attacks[Math.floor(Math.random() * attacks.length)];

    if (chosen === 'slam') {
      this.attackGroundSlam();
    } else if (chosen === 'cleave') {
      this.attackVoidCleave();
    } else {
      this.attackAbyssalTeleport();
    }
  }

  // Attack 1: Ground Slam with ground shockwaves
  attackGroundSlam() {
    this.isAttacking = true;
    this.body.setVelocity(0, -340); // leap up

    this.scene.time.delayedCall(450, () => {
      if (this.isDead || this.isStunned) return;
      this.setTexture('boss_slam');
      this.body.setVelocityY(520); // slam down!

      // Ground impact check
      this.scene.time.delayedCall(220, () => {
        if (this.isDead || this.isStunned) return;
        soundFX.playExplosion();
        this.scene.cameras.main.shake(250, 0.015);

        // Spawn left & right shockwaves travelling across floor
        this.scene.spawnShockwave(this.x - 30, this.y + 36, -1);
        this.scene.spawnShockwave(this.x + 30, this.y + 36, 1);

        if (this.phase === 3) {
          // Double shockwave surge in phase 3
          this.scene.time.delayedCall(160, () => {
            if (this.isDead) return;
            this.scene.spawnShockwave(this.x - 50, this.y + 36, -1);
            this.scene.spawnShockwave(this.x + 50, this.y + 36, 1);
          });
        }

        this.scene.time.delayedCall(400, () => {
          this.isAttacking = false;
          this.scheduleNextAction(1800);
        });
      });
    });
  }

  // Attack 2: Heavy Void Cleave Lunge (Deflectable with Percy's Shield Bash!)
  attackVoidCleave() {
    this.isAttacking = true;
    this.isLunging = true;
    const player = this.scene.player;
    const dir = player.x > this.x ? 1 : -1;
    this.setFlipX(dir < 0);

    // Warning crimson flash indicating heavy void strike
    this.setTint(0xf43f5e);
    this.body.setVelocityX(0);

    this.scene.time.delayedCall(400, () => {
      if (this.isDead || this.isStunned) return;
      this.clearTint();
      this.setTexture('boss_slam');
      soundFX.playSlash(3);

      // Heavy lunge forward
      const lungeSpeed = this.phase === 3 ? 380 : 300;
      this.body.setVelocityX(dir * lungeSpeed);

      // Hit check on player if not deflected
      this.scene.time.delayedCall(180, () => {
        if (this.isDead || this.isStunned || !this.isLunging) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist < 85) {
          player.takeDamage(this.damage, this.x);
        }
      });

      this.scene.time.delayedCall(500, () => {
        this.isLunging = false;
        this.isAttacking = false;
        this.scheduleNextAction(1600);
      });
    });
  }

  // Attack 3: Abyssal Teleport behind player
  attackAbyssalTeleport() {
    this.isAttacking = true;
    this.body.setVelocity(0, 0);

    // Fade out in smoke
    this.scene.createMagicBurst(this.x, this.y, 0xa855f7);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        if (this.isDead || this.isStunned) return;
        const player = this.scene.player;
        const rawX = player.x + (player.facing === 'right' ? -90 : 90);
        const appearX = Phaser.Math.Clamp(rawX, 4580, 5200);
        const appearY = Phaser.Math.Clamp(player.y - 10, 1500, 1610);
        this.setPosition(appearX, appearY);
        this.setFlipX(player.x < this.x);

        // Reappear
        this.scene.createMagicBurst(this.x, this.y, 0xa855f7);
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          duration: 180,
          onComplete: () => {
            if (this.isDead || this.isStunned) return;
            this.attackVoidCleave();
          },
        });
      },
    });
  }

  // Attack 4 (Air): Swoop dive from sky
  attackSwoop() {
    this.isAttacking = true;
    const player = this.scene.player;
    const dir = player.x > this.x ? 1 : -1;

    soundFX.playSlash(2);
    this.body.setVelocity(dir * 260, 200);

    this.scene.time.delayedCall(700, () => {
      if (this.isDead || this.isStunned) return;
      this.isAttacking = false;
      this.body.setVelocity(0, 0);
      this.scheduleNextAction(1800);
    });
  }

  takeDamage(amount, sourceX, attackType = 'melee') {
    if (this.isDead || !this.bossActive) return;

    // Phase 3 Astral Barrier check
    if (this.barrierActive) {
      if (attackType === 'astral_ray') {
        this.shatterBarrier();
        return;
      } else {
        // Physical attacks bounce off harmlessly
        soundFX.playHit(false);
        this.scene.createDamageNumber(this.x, this.y - 35, 'AEGIS IMMUNE!', '#67e8f9');
        this.scene.createMagicBurst(this.x, this.y, 0x67e8f9);
        return;
      }
    }

    // Phase 2 Levitation aerial hit check
    if (this.isLevitating) {
      this.knockDownFromSky();
      return;
    }

    // Shield Bash deflection check
    if (attackType === 'shield_bash' && this.isLunging) {
      this.deflectLunge();
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.scene.events.emit('boss_health_changed', this.health, this.maxHealth);

    // Flash white
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (!this.isDead) this.clearTint();
    });

    soundFX.playHit(true);
    this.scene.createDamageNumber(this.x, this.y - 45, amount, '#a855f7');

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    if (this.barrierSprite) this.barrierSprite.destroy();
    if (this.meteorEvent) this.meteorEvent.remove();
    if (this.actionTimer) this.actionTimer.remove();

    soundFX.playExplosion();
    soundFX.playVictoryFanfare();
    this.scene.cameras.main.shake(500, 0.025);

    // Boss defeat event for UIScene
    this.scene.events.emit('boss_defeated');

    // Explosions of soul particles
    for (let i = 0; i < 7; i++) {
      this.scene.time.delayedCall(i * 180, () => {
        this.scene.createMagicBurst(
          this.x + (Math.random() * 80 - 40),
          this.y + (Math.random() * 80 - 40),
          0xc084fc
        );
      });
    }

    this.scene.spawnSoulOrbs(this.x, this.y, 10);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.1,
      duration: 1500,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}

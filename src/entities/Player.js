import Phaser from 'phaser';
import { SISTERS_DATA } from '../utils/SisterSpriteGenerator.js';
import { soundFX } from '../audio/SoundFX.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, sisterId = 'wren') {
    const sisterData = SISTERS_DATA[sisterId] || SISTERS_DATA.wren;
    super(scene, x, y, `${sisterData.id}_idle_0`);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.sisterData = sisterData;
    this.sisterId = sisterData.id;

    // Physics bounds & properties
    this.body.setSize(22, 54);
    this.body.setOffset(13, 10);
    this.setCollideWorldBounds(true);

    // Stats tailored to selected sister (plus Phase 4 keepsake bonuses)
    this.bonusMaxHealth = 0;
    this.bonusMaxSoul = 0;
    this.collectedKeepsakes = new Set();
    this.maxHealth = this.sisterData.stats.health;
    this.health = this.maxHealth;
    this.maxSoul = this.sisterData.stats.soul;
    this.soul = 50;

    // Movement & Mobility
    this.moveSpeed = this.sisterData.stats.speed;
    this.jumpForce = this.sisterData.stats.jump;
    this.canDoubleJump = true;
    this.isWallSliding = false;
    this.facing = 'right';

    // Attack combo state
    this.comboStep = 0;
    this.comboTimer = null;
    this.isAttacking = false;
    this.attackCooldown = false;

    // Dodge Roll state
    this.isRolling = false;
    this.rollCooldown = false;
    this.isInvulnerable = false;

    // Hitstop / Stun
    this.isHurt = false;
    this.isDead = false;

    // Checkpoint
    this.checkpoint = { x, y };

    // Dynamic sword hitbox sensor
    this.swordHitbox = scene.add.rectangle(x + 34, y, 54, 52, 0xffffff, 0);
    scene.physics.add.existing(this.swordHitbox, false);
    this.swordHitbox.body.setAllowGravity(false);
    this.swordHitbox.body.setImmovable(true);
    this.swordHitbox.body.enable = false;

    // Phase 2: Ability Matrix
    // Player starts with chosen sister's signature ability unlocked
    this.abilities = {
      dash: this.sisterId === 'wren',
      shieldBash: this.sisterId === 'percy',
      astralRay: this.sisterId === 'mona',
      grapple: this.sisterId === 'tilly',
    };

    // Shield Bash Hitbox & Visual Aura
    this.shieldHitbox = scene.add.rectangle(x + 34, y, 52, 54, 0xf59e0b, 0);
    scene.physics.add.existing(this.shieldHitbox, false);
    this.shieldHitbox.body.setAllowGravity(false);
    this.shieldHitbox.body.setImmovable(true);
    this.shieldHitbox.body.enable = false;

    this.shieldAuraSprite = scene.add.image(x, y, 'aegis_shield_aura');
    this.shieldAuraSprite.setVisible(false);
    this.shieldAuraSprite.setDepth(15);

    this.isBashing = false;
    this.bashCooldown = false;
    this.isAirDashing = false;
    this.hasAirDashed = false;
    this.isGrappling = false;

    // Phase 7: Hack-and-Slash Combat & Sister Assists
    this.isCounterCharged = false;
    this.isParrying = false;
    this.isDiving = false;
    this.isUppercutting = false;
    this.isExecuting = false;
    this.executePrompt = null;

    this.afterimageEvent = null;
    this.attackAnimEvents = [];
    this.rawAttackPressed = false;

    // Direct keydown listener to catch synthetic/CDP and alternate keyboard layouts
    scene.input.keyboard.on('keydown', (e) => {
      const k = e.key ? e.key.toLowerCase() : '';
      if (k === 'z' || k === 'j' || e.code === 'KeyZ' || e.code === 'KeyJ') {
        this.rawAttackPressed = true;
      }
    });
  }

  update(cursors, keys, gamepad, isInteractPressed = false) {
    if (this.isDead || this.isExecuting) return false;

    const onGround = this.body.blocked.down;

    if (onGround) {
      this.canDoubleJump = true;
      this.hasAirDashed = false;
      this.isWallSliding = false;

      // Land aerial dive strike with seismic shockwave
      if (this.isDiving) {
        this.landDiveStrike();
      }
    }

    const onWall = (this.body.blocked.left || this.body.blocked.right) && !onGround;
    if (onWall && this.body.velocity.y > 0) {
      this.isWallSliding = true;
      this.body.setVelocityY(Math.min(this.body.velocity.y, 80));
    } else {
      this.isWallSliding = false;
    }

    const offset = this.comboStep === 3 ? 55 : (this.comboStep === 2 ? 38 : 34);
    const hitOffsetX = this.facing === 'right' ? offset : -offset;
    this.swordHitbox.setPosition(this.x + hitOffsetX, this.y);

    if (this.isBashing) {
      const shieldOffset = this.facing === 'right' ? 32 : -32;
      this.shieldHitbox.setPosition(this.x + shieldOffset, this.y);
      this.shieldAuraSprite.setPosition(this.x + shieldOffset, this.y);
    }

    // Check execution opportunity on nearby staggered/weak enemies
    const executed = this.checkExecutionOpportunities(isInteractPressed);
    if (executed) return true;

    // 1. Percy's Aegis Bash (F, U, or Gamepad LT)
    const bashPressed = (keys.bash && (Phaser.Input.Keyboard.JustDown(keys.bash) || (keys.bashAlt && Phaser.Input.Keyboard.JustDown(keys.bashAlt)))) || (gamepad && gamepad.justDown('shieldBash'));
    if (bashPressed && !this.isBashing && !this.isRolling && !this.isAirDashing) {
      if (this.abilities.shieldBash) {
        this.performShieldBash();
        return;
      } else {
        this.scene.events.emit('ability_locked', 'Aegis Bash', 'Rescue Percy to unlock the shield bash!');
      }
    }

    // 2. Mona's Astral Ray (R, I, or Gamepad LB)
    const rayPressed = (keys.ray && (Phaser.Input.Keyboard.JustDown(keys.ray) || (keys.rayAlt && Phaser.Input.Keyboard.JustDown(keys.rayAlt)))) || (gamepad && gamepad.justDown('astralRay'));
    if (rayPressed && !this.isAttacking && !this.isRolling && !this.isAirDashing) {
      if (this.abilities.astralRay) {
        this.castAstralRay();
        return;
      } else {
        this.scene.events.emit('ability_locked', 'Astral Ray', 'Rescue Mona to unlock the celestial ray!');
      }
    }

    // 3. Tilly's Grapple Whip (V, O, or Gamepad R3/L3)
    const grapplePressed = (keys.grapple && (Phaser.Input.Keyboard.JustDown(keys.grapple) || (keys.grappleAlt && Phaser.Input.Keyboard.JustDown(keys.grappleAlt)))) || (gamepad && gamepad.justDown('grapple'));
    if (grapplePressed && !this.isGrappling && !this.isRolling && !this.isAirDashing) {
      if (this.abilities.grapple) {
        this.performGrapple();
        return;
      } else {
        this.scene.events.emit('ability_locked', 'Grapple Whip', 'Rescue Tilly to unlock the grapple whip!');
      }
    }

    // 4. Timed Guard / Parry (Q, or Gamepad LB)
    const parryPressed = (keys.parry && Phaser.Input.Keyboard.JustDown(keys.parry)) || (gamepad && gamepad.justDown('parry'));
    if (parryPressed && !this.isParrying && !this.isRolling && !this.isAttacking) {
      this.performParry();
      return;
    }

    // 5. Sister Synergy Assist Summon (Tab, T, or Gamepad assist)
    const assistPressed = (keys.assist && Phaser.Input.Keyboard.JustDown(keys.assist)) ||
      (keys.assistAlt && Phaser.Input.Keyboard.JustDown(keys.assistAlt)) ||
      (gamepad && gamepad.justDown('assist'));
    if (assistPressed && !this.isRolling) {
      this.performSisterAssist();
      return;
    }

    // Attack input (Z, J, Left Click, or Gamepad X)
    const attackPressed = this.rawAttackPressed || Phaser.Input.Keyboard.JustDown(keys.attack) || Phaser.Input.Keyboard.JustDown(keys.attackAlt) || this.scene.input.activePointer.leftButtonDown() || (gamepad && gamepad.justDown('attack'));
    this.rawAttackPressed = false;
    if (attackPressed && !this.isAttacking && !this.isRolling && !this.isAirDashing && !this.isBashing && !this.isDiving) {
      const upHeld = cursors.up.isDown || keys.W.isDown || (gamepad && gamepad.isDown('up'));
      const downHeld = cursors.down.isDown || keys.S.isDown || (gamepad && gamepad.isDown('down'));

      if (onGround && upHeld) {
        this.performUppercutLauncher();
        return;
      } else if (!onGround && downHeld) {
        this.performDiveStrike();
        return;
      } else {
        this.performAttack();
        return;
      }
    }

    // Cast Soul Bolt input (X, K, Q, or Gamepad Y)
    const castPressed = Phaser.Input.Keyboard.JustDown(keys.cast) || Phaser.Input.Keyboard.JustDown(keys.castAlt) || Phaser.Input.Keyboard.JustDown(keys.castQ) || (gamepad && gamepad.justDown('cast'));
    if (castPressed && !this.isAttacking && !this.isRolling && !this.isAirDashing && !this.isBashing) {
      this.castSoulBolt();
    }

    // Roll / Air Dash input (Shift, L, C, Right-Click, or Gamepad RB/RT)
    const dashPressed = Phaser.Input.Keyboard.JustDown(keys.roll) || Phaser.Input.Keyboard.JustDown(keys.rollAlt) || Phaser.Input.Keyboard.JustDown(keys.rollC) || this.scene.input.activePointer.rightButtonDown() || (gamepad && gamepad.justDown('dash'));
    if (dashPressed && !this.rollCooldown && !this.isRolling && !this.isAirDashing && !this.isBashing) {
      if (!onGround) {
        if (this.abilities.dash && !this.hasAirDashed) {
          this.performAirDash();
          return;
        } else if (!this.abilities.dash) {
          this.scene.events.emit('ability_locked', 'Zephyr Air Dash', 'Rescue Wren to unlock the aerial dash!');
        }
      } else {
        this.performRoll();
        return;
      }
    }

    if (this.isRolling || this.isAirDashing || this.isBashing || this.isGrappling) return;
    if (this.isAttacking && onGround) {
      this.body.setVelocityX(this.body.velocity.x * 0.7);
      return;
    }

    // Horizontal Movement (Keyboard or Gamepad Stick / D-Pad)
    const left = cursors.left.isDown || keys.A.isDown || (gamepad && gamepad.isDown('left'));
    const right = cursors.right.isDown || keys.D.isDown || (gamepad && gamepad.isDown('right'));

    if (left) {
      this.body.setVelocityX(-this.moveSpeed);
      this.setFlipX(true);
      this.facing = 'left';
    } else if (right) {
      this.body.setVelocityX(this.moveSpeed);
      this.setFlipX(false);
      this.facing = 'right';
    } else {
      this.body.setVelocityX(this.body.velocity.x * 0.82);
      if (Math.abs(this.body.velocity.x) < 5) this.body.setVelocityX(0);
    }

    // Jump / Wall Jump / Double Jump (Keyboard or Gamepad A)
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(keys.W) || Phaser.Input.Keyboard.JustDown(keys.space) || (gamepad && gamepad.justDown('jump'));
    if (jumpPressed) {
      if (onGround) {
        this.body.setVelocityY(this.jumpForce);
        soundFX.playJump();
        this.scene.createDustPuff(this.x, this.y + 26);
      } else if (this.isWallSliding) {
        const kickDir = this.body.blocked.left ? 1 : -1;
        this.body.setVelocityY(this.jumpForce * 0.95);
        this.body.setVelocityX(kickDir * (this.moveSpeed * 1.3));
        this.setFlipX(kickDir === -1);
        this.facing = kickDir === 1 ? 'right' : 'left';
        soundFX.playJump();
        this.scene.createDustPuff(this.x, this.y);
      } else if (this.canDoubleJump) {
        this.canDoubleJump = false;
        this.body.setVelocityY(this.jumpForce * 0.9);
        soundFX.playJump();
        this.scene.createMagicBurst(this.x, this.y + 20, this.sisterData.palette.projectileTint);
      }
    }

    // Sister-specific Animation frames
    if (!this.isAttacking && !this.isHurt) {
      if (!onGround) {
        if (this.body.velocity.y < -120) {
          this.setTexture(`${this.sisterId}_jump`);
        } else if (this.body.velocity.y > 120) {
          this.setTexture(`${this.sisterId}_fall`);
        } else {
          this.setTexture(`${this.sisterId}_apex`);
        }
      } else if (Math.abs(this.body.velocity.x) > 15) {
        // Fluid 8-frame run locomotion at ~14 FPS
        const animFrame = Math.floor((this.scene.time.now / 70) % 8);
        this.setTexture(`${this.sisterId}_run_${animFrame}`);
      } else {
        // Subtle 4-frame breathing idle cycle
        const animFrame = Math.floor((this.scene.time.now / 220) % 4);
        this.setTexture(`${this.sisterId}_idle_${animFrame}`);
      }
    }
  }

  // --- CANCEL ATTACK / RESET ANIMS ---
  cancelAttack() {
    if (this.attackAnimEvents && this.attackAnimEvents.length > 0) {
      this.attackAnimEvents.forEach(e => e.remove());
      this.attackAnimEvents = [];
    }
    this.isAttacking = false;
    if (this.swordHitbox && this.swordHitbox.body) {
      this.swordHitbox.body.enable = false;
    }
    this.setOrigin(0.5, 0.5);
  }

  // --- 3-HIT COMBO: Multi-Frame Fluid Attack Keyframe Sequencer ---
  performAttack() {
    this.cancelAttack();
    this.isAttacking = true;
    if (this.comboTimer) this.comboTimer.remove();

    this.comboStep = (this.comboStep % 3) + 1;
    const step = this.comboStep;

    // Anchor origin to (0.375, 0.5) so that the 64x64 attack frame's body (centered at x=24)
    // precisely matches the 48x64 idle/run sprite (centered at x=24) with zero displacement!
    this.setOrigin(0.375, 0.5);

    // Frame timings per step:
    // Step 1: 4 frames, total 135ms (Snappy swift strike)
    // Step 2: 4 frames, total 155ms (Fluid rising crescent uppercut)
    // Step 3: 5 frames, total 255ms (Monumental heavy finisher / meteor smash)
    const frameDelays = step === 3
      ? [0, 45, 90, 150, 205]
      : (step === 2 ? [0, 30, 70, 115] : [0, 25, 60, 95]);
    const totalFrames = frameDelays.length;
    const totalDuration = step === 3 ? 255 : (step === 2 ? 155 : 135);

    // Initial frame 0: Anticipation / Coiling
    this.setTexture(`${this.sisterId}_atk${step}_0`);

    // Queue subsequent keyframes
    for (let f = 1; f < totalFrames; f++) {
      const frameIdx = f;
      const evt = this.scene.time.delayedCall(frameDelays[frameIdx], () => {
        if (this.isAttacking && this.comboStep === step) {
          this.setTexture(`${this.sisterId}_atk${step}_${frameIdx}`);
        }
      });
      this.attackAnimEvents.push(evt);
    }

    // Dynamic Hitbox sizing
    if (this.comboStep === 3) {
      this.swordHitbox.setSize(85, 60);
      this.swordHitbox.body.setSize(85, 60);
    } else if (this.comboStep === 2) {
      this.swordHitbox.setSize(65, 52);
      this.swordHitbox.body.setSize(65, 52);
    } else {
      this.swordHitbox.setSize(56, 48);
      this.swordHitbox.body.setSize(56, 48);
    }

    const offset = this.comboStep === 3 ? 55 : (this.comboStep === 2 ? 40 : 36);
    const hitOffsetX = this.facing === 'right' ? offset : -offset;
    this.swordHitbox.setPosition(this.x + hitOffsetX, this.y);

    const impulse = this.comboStep === 3 ? 190 : (this.comboStep === 2 ? 100 : 90);
    this.body.setVelocityX(this.facing === 'right' ? impulse : -impulse);

    soundFX.playSlash(this.comboStep);
    this.swordHitbox.body.enable = true;

    // 3rd strike unleashes long-range blade wave on peak impact (frame 2 at ~90ms)
    if (this.comboStep === 3) {
      const waveEvt = this.scene.time.delayedCall(90, () => {
        if (this.isAttacking && this.comboStep === 3) {
          this.scene.cameras.main.shake(140, 0.009);
          const waveX = this.x + (this.facing === 'right' ? 36 : -36);
          this.scene.spawnSlashWave(waveX, this.y, this.facing === 'right' ? 1 : -1, this.sisterData.palette.projectileTint);
        }
      });
      this.attackAnimEvents.push(waveEvt);
    }

    // End of attack recovery
    const endEvt = this.scene.time.delayedCall(totalDuration, () => {
      this.swordHitbox.body.enable = false;
      this.isAttacking = false;
      this.setOrigin(0.5, 0.5); // Reset origin back to center for 48px idle/run sprites

      this.comboTimer = this.scene.time.delayedCall(550, () => {
        this.comboStep = 0;
      });
    });
    this.attackAnimEvents.push(endEvt);
  }

  // --- DODGE ROLL / SHADOW DASH ---
  performRoll() {
    this.cancelAttack();
    this.isRolling = true;
    this.rollCooldown = true;
    this.setTexture(`${this.sisterId}_roll`);
    this.body.setSize(22, 54);
    this.body.setOffset(13, 10);

    soundFX.playRoll();

    const rollSpeed = 420;
    this.body.setVelocityX(this.facing === 'right' ? rollSpeed : -rollSpeed);
    if (this.body.blocked.down) {
      this.body.setVelocityY(0);
    }

    // Spawn afterimages with sister's signature aura tint
    const afterimageTimer = this.scene.time.addEvent({
      delay: 45,
      repeat: 4,
      callback: () => {
        const ghost = this.scene.add.image(this.x, this.y, `${this.sisterId}_roll`);
        ghost.setFlipX(this.flipX);
        ghost.setTint(this.sisterData.palette.projectileTint);
        ghost.setAlpha(0.65);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 0.8,
          duration: 220,
          onComplete: () => ghost.destroy(),
        });
      },
    });

    this.scene.time.delayedCall(260, () => {
      this.isRolling = false;
      this.isInvulnerable = false;
      this.body.setSize(22, 54);
      this.body.setOffset(13, 10);
    });

    this.scene.time.delayedCall(750, () => {
      this.rollCooldown = false;
    });
  }

  // --- CAST SOUL BOLT SPELL ---
  castSoulBolt() {
    const manaCost = 25;
    if (this.soul < manaCost) {
      this.scene.events.emit('soul_depleted');
      return;
    }

    this.soul -= manaCost;
    this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
    soundFX.playCast();

    this.setTexture(`${this.sisterId}_cast`);
    this.isAttacking = true;

    const dir = this.facing === 'right' ? 1 : -1;
    const spawnX = this.x + dir * 26;
    const spawnY = this.y - 2;

    this.scene.spawnSoulBolt(spawnX, spawnY, dir, this.sisterData.palette.projectileTint);

    this.scene.time.delayedCall(160, () => {
      this.isAttacking = false;
    });
  }

  // --- PHASE 2: SIGNATURE ABILITIES ---

  // 1. Wren's Zephyr Air Dash: Mid-air horizontal burst with zero gravity
  performAirDash() {
    this.isAirDashing = true;
    this.hasAirDashed = true;
    this.isInvulnerable = true;
    this.setTexture(`${this.sisterId}_jump`);

    soundFX.playJump();
    this.scene.cameras.main.shake(120, 0.007);
    this.scene.createMagicBurst(this.x, this.y, 0x10b981);

    this.body.setAllowGravity(false);
    this.body.setVelocityY(0);
    const dashSpeed = 500;
    this.body.setVelocityX(this.facing === 'right' ? dashSpeed : -dashSpeed);

    // Green emerald wind afterimages
    this.scene.time.addEvent({
      delay: 35,
      repeat: 5,
      callback: () => {
        const ghost = this.scene.add.image(this.x, this.y, `${this.sisterId}_jump`);
        ghost.setFlipX(this.flipX);
        ghost.setTint(0x10b981);
        ghost.setAlpha(0.7);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 0.85,
          duration: 200,
          onComplete: () => ghost.destroy(),
        });
      },
    });

    this.scene.time.delayedCall(240, () => {
      this.isAirDashing = false;
      this.isInvulnerable = false;
      this.body.setAllowGravity(true);
      this.body.setVelocityX(this.body.velocity.x * 0.4);
    });
  }

  // 2. Percy's Aegis Bash: Shield charge that shatters cracked walls and deflects attacks
  performShieldBash() {
    this.isBashing = true;
    this.bashCooldown = true;
    this.isInvulnerable = true;

    soundFX.playShieldBash();
    this.scene.cameras.main.shake(140, 0.009);

    const dir = this.facing === 'right' ? 1 : -1;
    const offset = dir * 32;
    this.shieldHitbox.setPosition(this.x + offset, this.y);
    this.shieldHitbox.body.enable = true;

    this.shieldAuraSprite.setPosition(this.x + offset, this.y);
    this.shieldAuraSprite.setFlipX(this.facing === 'left');
    this.shieldAuraSprite.setVisible(true);

    const bashSpeed = 380;
    this.body.setVelocityX(dir * bashSpeed);

    // Check hit on cracked walls and enemies
    this.scene.handleShieldBashImpact(this.shieldHitbox, dir);

    this.scene.time.delayedCall(260, () => {
      this.isBashing = false;
      this.isInvulnerable = false;
      this.shieldHitbox.body.enable = false;
      this.shieldAuraSprite.setVisible(false);
    });

    this.scene.time.delayedCall(650, () => {
      this.bashCooldown = false;
    });
  }

  // 3. Mona's Astral Ray: Piercing beam of starlight activating arcane crystals
  castAstralRay() {
    const manaCost = 20;
    if (this.soul < manaCost) {
      this.scene.events.emit('soul_depleted');
      return;
    }

    this.soul -= manaCost;
    this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
    soundFX.playAstralRay();

    this.setTexture(`${this.sisterId}_cast`);
    this.isAttacking = true;
    this.scene.cameras.main.shake(160, 0.008);

    const dir = this.facing === 'right' ? 1 : -1;
    const spawnX = this.x + dir * 30;
    const spawnY = this.y;

    this.scene.spawnAstralRay(spawnX, spawnY, dir);

    this.scene.time.delayedCall(220, () => {
      this.isAttacking = false;
    });
  }

  // 4. Tilly's Grapple Whip: Hook onto overhead rings and vault upward
  performGrapple() {
    const ring = this.scene.findNearestGrappleRing(this.x, this.y, 280);
    if (!ring) {
      this.scene.events.emit('show_toast', 'No overhead anchor ring in range!');
      return;
    }

    this.isGrappling = true;
    soundFX.playGrappleShoot();

    // Draw chain whip visual
    const chainGraphics = this.scene.add.graphics();
    chainGraphics.lineStyle(2.5, 0xef4444, 0.95);
    chainGraphics.beginPath();
    chainGraphics.moveTo(this.x, this.y);
    chainGraphics.lineTo(ring.x, ring.y);
    chainGraphics.stroke();

    this.scene.time.delayedCall(60, () => {
      soundFX.playGrappleLatch();
      this.scene.createMagicBurst(ring.x, ring.y, 0xf59e0b);

      const dirX = ring.x > this.x ? 1 : -1;
      this.body.setVelocityY(-490);
      this.body.setVelocityX(dirX * 320);

      this.canDoubleJump = true;
      this.hasAirDashed = false;

      this.scene.tweens.add({
        targets: chainGraphics,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          chainGraphics.destroy();
          this.isGrappling = false;
        },
      });
    });
  }

  // Bestow and unlock ability from rescued sister
  unlockAbility(key) {
    if (this.abilities[key]) return;
    this.abilities[key] = true;
    soundFX.playSisterRescue();
    this.scene.events.emit('ability_unlocked', key, this.abilities);
  }

  // Phase 4: Apply Ancient Sister Keepsake upgrade (+25 Max Health or +25 Max Soul)
  applyKeepsake(keepsakeId, type, amount = 25) {
    if (this.collectedKeepsakes.has(keepsakeId)) return false;
    this.collectedKeepsakes.add(keepsakeId);

    if (type === 'health') {
      this.bonusMaxHealth += amount;
      this.maxHealth += amount;
      this.health = Math.min(this.health + amount, this.maxHealth);
      this.scene.events.emit('health_changed', this.health, this.maxHealth);
    } else if (type === 'soul') {
      this.bonusMaxSoul += amount;
      this.maxSoul += amount;
      this.soul = Math.min(this.soul + amount, this.maxSoul);
      this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
    }

    soundFX.playKeepsakeCollect();
    return true;
  }

  // Phase 4: Dynamic Lead Sister Swapping without restarting run
  swapSister(newSisterId) {
    if (!newSisterId || newSisterId === this.sisterId || !SISTERS_DATA[newSisterId]) return false;

    const oldSisterId = this.sisterId;
    this.sisterData = SISTERS_DATA[newSisterId];
    this.sisterId = newSisterId;

    // Preserve proportional health and soul
    const prevHealthPercent = this.maxHealth > 0 ? this.health / this.maxHealth : 1;
    const prevSoulPercent = this.maxSoul > 0 ? this.soul / this.maxSoul : 1;

    this.maxHealth = this.sisterData.stats.health + this.bonusMaxHealth;
    this.health = Math.max(1, Math.round(this.maxHealth * prevHealthPercent));
    this.maxSoul = this.sisterData.stats.soul + this.bonusMaxSoul;
    this.soul = Math.max(1, Math.round(this.maxSoul * prevSoulPercent));

    // Update mobility & base attributes
    this.moveSpeed = this.sisterData.stats.speed;
    this.jumpForce = this.sisterData.stats.jump;

    // Automatically ensure the newly chosen sister's signature ability is available
    if (newSisterId === 'wren') this.abilities.dash = true;
    if (newSisterId === 'percy') this.abilities.shieldBash = true;
    if (newSisterId === 'mona') this.abilities.astralRay = true;
    if (newSisterId === 'tilly') this.abilities.grapple = true;

    // Visuals and sounds
    this.setTexture(`${this.sisterId}_idle_0`);
    soundFX.playSisterSwap();
    this.scene.createMagicBurst(this.x, this.y, this.sisterData.palette.projectileTint);

    // Notify scene and UI
    this.scene.events.emit('lead_sister_swapped', this.sisterId, this.sisterData, oldSisterId);
    this.scene.events.emit('health_changed', this.health, this.maxHealth);
    this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
    this.scene.events.emit('ability_unlocked', null, this.abilities);

    return true;
  }

  // --- RECEIVE DAMAGE ---
  takeDamage(amount, sourceX) {
    if (this.isInvulnerable || this.isDead || this.isExecuting) return;

    // Perfect Timed Parry Intercept
    if (this.isParrying) {
      this.isParrying = false;
      this.clearTint();
      this.isCounterCharged = true;

      soundFX.playParry();
      this.scene.cameras.main.shake(160, 0.015);
      this.scene.spawnParrySpark(this.x, this.y);
      this.scene.createDamageNumber(this.x, this.y - 30, 'PERFECT PARRY!', '#fbbf24');
      this.gainSoul(20);

      // Hitstop screen freeze for 80ms
      this.scene.physics.world.pause();
      setTimeout(() => this.scene.physics.world.resume(), 80);

      // Stagger attacking and nearby enemies
      this.scene.enemies.getChildren().forEach((e) => {
        if (e && e.active && !e.isDead && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < 140) {
          if (e.stagger) e.stagger(1500);
        }
      });
      return;
    }

    this.cancelAttack();
    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.isHurt = true;
    this.setTexture(`${this.sisterId}_hurt`);

    soundFX.playHurt();
    this.scene.cameras.main.shake(160, 0.012);
    this.scene.events.emit('health_changed', this.health, this.maxHealth);

    const knockDir = sourceX ? (this.x < sourceX ? -1 : 1) : (this.facing === 'right' ? -1 : 1);
    this.body.setVelocityX(knockDir * 240);
    this.body.setVelocityY(-200);

    this.scene.createDamageNumber(this.x, this.y - 20, amount, '#ef4444');

    if (this.health <= 0) {
      this.die();
      return;
    }

    this.scene.time.delayedCall(160, () => {
      this.isHurt = false;
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.setAlpha(1);
        this.isInvulnerable = false;
      },
    });
  }

  gainSoul(amount) {
    this.soul = Math.min(this.maxSoul, this.soul + amount);
    this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
  }

  restAtShrine(shrineX, shrineY) {
    this.checkpoint = { x: shrineX, y: shrineY - 10 };
    this.health = this.maxHealth;
    this.soul = this.maxSoul;
    this.scene.events.emit('health_changed', this.health, this.maxHealth);
    this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
    soundFX.playShrineRest();
    this.scene.createMagicBurst(this.x, this.y, this.sisterData.palette.projectileTint);
    this.scene.events.emit('shrine_rested');
  }

  die() {
    this.cancelAttack();
    this.isDead = true;
    this.body.setVelocity(0, 0);
    this.setTexture(`${this.sisterId}_hurt`);
    this.setTint(0x4a0404);
    this.scene.events.emit('player_died');

    this.scene.time.delayedCall(1800, () => {
      this.respawn();
    });
  }

  respawn() {
    this.setPosition(this.checkpoint.x, this.checkpoint.y);
    this.health = this.maxHealth;
    this.soul = this.maxSoul;
    this.isDead = false;
    this.clearTint();
    this.setAlpha(1);
    this.body.setVelocity(0, 0);
    this.scene.events.emit('health_changed', this.health, this.maxHealth);
    this.scene.events.emit('soul_changed', this.soul, this.maxSoul);
    this.scene.events.emit('player_respawned');
  }

  // =========================================================================
  // PHASE 7: AIR JUGGLE, DIVE STRIKE, PARRY, EXECUTION & SISTER ASSISTS
  // =========================================================================
  performUppercutLauncher() {
    this.cancelAttack();
    this.isAttacking = true;
    this.isUppercutting = true;
    this.setTexture(`${this.sisterId}_atk2_1`);

    soundFX.playSlash(2);
    this.body.setVelocityY(-420);
    this.body.setVelocityX(this.facing === 'right' ? 80 : -80);

    this.swordHitbox.setSize(72, 75);
    this.swordHitbox.body.setSize(72, 75);
    this.swordHitbox.setPosition(this.x + (this.facing === 'right' ? 36 : -36), this.y - 20);
    this.swordHitbox.body.enable = true;

    this.scene.cameras.main.shake(120, 0.008);

    this.scene.time.delayedCall(280, () => {
      this.swordHitbox.body.enable = false;
      this.isAttacking = false;
      this.isUppercutting = false;
    });
  }

  performDiveStrike() {
    this.cancelAttack();
    this.isDiving = true;
    this.isAttacking = true;
    this.setTexture(`${this.sisterId}_atk3_2`);

    soundFX.playSlash(3);
    this.body.setVelocityX(0);
    this.body.setVelocityY(680);

    this.swordHitbox.setSize(60, 70);
    this.swordHitbox.body.setSize(60, 70);
    this.swordHitbox.setPosition(this.x, this.y + 20);
    this.swordHitbox.body.enable = true;
  }

  landDiveStrike() {
    this.isDiving = false;
    this.isAttacking = false;
    this.swordHitbox.body.enable = false;

    soundFX.playWallBreak();
    this.scene.cameras.main.shake(240, 0.02);
    this.scene.spawnDiveShockwave(this.x, this.y);
  }

  performParry() {
    this.cancelAttack();
    this.isParrying = true;
    this.setTexture(`${this.sisterId}_roll`);
    this.setTint(0xfbbf24);

    // Parry window: 200ms
    this.scene.time.delayedCall(200, () => {
      this.isParrying = false;
      this.clearTint();
    });
  }

  checkExecutionOpportunities(isInteractPressed = false) {
    if (this.isExecuting || !this.scene.enemies) return false;

    let target = null;
    let closestDist = 75;

    this.scene.enemies.getChildren().forEach((e) => {
      if (e && e.active && !e.isDead && (e.isStaggered || e.health <= e.maxHealth * 0.28)) {
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (d < closestDist) {
          closestDist = d;
          target = e;
        }
      }
    });

    if (target) {
      if (!this.executePrompt) {
        this.executePrompt = this.scene.add.text(target.x, target.y - 48, '[E / B] EXECUTE!', {
          fontFamily: 'Cinzel, serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#fbbf24',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(25);
      } else {
        this.executePrompt.setPosition(target.x, target.y - 48);
        this.executePrompt.setVisible(true);
      }

      if (isInteractPressed) {
        this.performExecution(target);
        return true;
      }
    } else if (this.executePrompt) {
      this.executePrompt.setVisible(false);
    }

    return false;
  }

  performExecution(target) {
    if (!target || target.isDead) return;
    this.isExecuting = true;
    this.isInvulnerable = true;
    this.body.setVelocity(0, 0);

    if (this.executePrompt) this.executePrompt.setVisible(false);

    // Position next to target
    this.x = target.x + (this.x < target.x ? -32 : 32);
    this.y = target.y;
    this.facing = this.x < target.x ? 'right' : 'left';
    this.setFlipX(this.facing === 'left');

    soundFX.playParry();
    this.scene.cameras.main.shake(280, 0.02);
    this.scene.createDamageNumber(target.x, target.y - 30, 'FATAL EXECUTION!', '#ef4444');

    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 90, () => {
        soundFX.playSlash(i + 1);
        this.scene.createMagicBurst(target.x, target.y, 0xef4444);
      });
    }

    this.scene.time.delayedCall(300, () => {
      target.takeDamage(999, this.x, 'execution');
      this.gainHealth(25);
      this.gainSoul(30);
      this.scene.spawnSoulOrbs(target.x, target.y - 20, 5);
      this.isExecuting = false;
      this.isInvulnerable = false;
    });
  }

  performSisterAssist() {
    if (this.soul < 35) {
      this.scene.events.emit('show_toast', '⚠️ Not enough Soul! Requires 35 Soul for Sister Assist.');
      return;
    }

    const available = [];
    if (this.abilities.astralRay || this.sisterId !== 'mona') available.push('mona');
    if (this.abilities.shieldBash || this.sisterId !== 'percy') available.push('percy');
    if (this.abilities.grapple || this.sisterId !== 'tilly') available.push('tilly');
    if (this.abilities.dash || this.sisterId !== 'wren') available.push('wren');

    const chosen = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 'wren';

    this.spendSoul(35);
    this.scene.triggerSisterAssist(chosen, this.x, this.y);
  }
}

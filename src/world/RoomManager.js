// RoomManager: Discrete Chamber Camera Bounding, Sliding Transitions,
// Interconnected World Graph, and Lockdown Combat Trial Chambers.

import Phaser from 'phaser';
import { ROOMS, RELIC_KEYS } from './WorldData.js';
import { soundFX } from '../audio/SoundFX.js';

export class RoomManager {
  constructor(scene) {
    this.scene = scene;
    this.currentRoom = null;
    this.discoveredRooms = new Set(['room_haven']);
    this.clearedTrials = new Set();
    this.activeTrial = null;
    this.trialEnemies = [];
    this.trialPortcullises = [];
    this.lastCheckTime = 0;
  }

  init(savedData = {}) {
    if (savedData.discoveredRooms) {
      this.discoveredRooms = new Set(savedData.discoveredRooms);
    }
    if (savedData.clearedTrials) {
      this.clearedTrials = new Set(savedData.clearedTrials);
    }
    this.discoveredRooms.add('room_haven');
  }

  update(playerX, playerY) {
    const now = this.scene.time.now;
    if (now - this.lastCheckTime < 32) return;
    this.lastCheckTime = now;

    // If an active trial is underway, check if all trial enemies are defeated
    if (this.activeTrial) {
      this.updateTrialCombat();
    }

    const matched = this.findRoomAt(playerX, playerY);
    if (!matched) return;

    if (!this.currentRoom || this.currentRoom.id !== matched.id) {
      this.transitionToRoom(matched);
    } else {
      // Keep camera smoothly enclosing the player during jumps, fast falls, or boundary crossings
      this.applyCameraBoundsForRoom(this.currentRoom, false);
    }

    // Camera follow safety net: Ensure player never disappears from camera viewport
    this.ensurePlayerInCameraView(playerX, playerY);
  }

  findRoomAt(x, y) {
    // 1. Hysteresis: If currently in a room and still inside bounds + 32px margin, retain it
    if (this.currentRoom) {
      const { minX, maxX, minY, maxY } = this.currentRoom.bounds;
      if (x >= minX - 32 && x <= maxX + 32 && y >= minY - 32 && y <= maxY + 32) {
        return this.currentRoom;
      }
    }

    // 2. Direct containment check across all rooms
    for (const key in ROOMS) {
      const room = ROOMS[key];
      const { minX, maxX, minY, maxY } = room.bounds;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return room;
      }
    }

    // 3. Fallback: Find closest room by Euclidean distance to bounding box (never jump to Haven blindly)
    let closestRoom = this.currentRoom || ROOMS.room_haven;
    let minDistanceSq = Infinity;

    for (const key in ROOMS) {
      const room = ROOMS[key];
      const { minX, maxX, minY, maxY } = room.bounds;
      const dx = Math.max(0, minX - x, x - maxX);
      const dy = Math.max(0, minY - y, y - maxY);
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestRoom = room;
      }
    }

    return closestRoom;
  }

  transitionToRoom(newRoom) {
    const prevRoom = this.currentRoom;
    this.currentRoom = newRoom;
    const isFirstDiscovery = !this.discoveredRooms.has(newRoom.id);
    this.discoveredRooms.add(newRoom.id);

    // Apply Screen-Edge Camera Bounding for the chamber
    this.applyCameraBoundsForRoom(newRoom, true);

    // Emit event for UIScene and HUD
    this.scene.events.emit('room_changed', {
      room: newRoom,
      prevRoom,
      isFirstDiscovery,
    });

    // Check for Combat Trial Chamber Lockdown
    if (newRoom.type === 'lockdown' && newRoom.trialId && !this.clearedTrials.has(newRoom.trialId)) {
      if (!this.activeTrial) {
        this.startTrialLockdown(newRoom);
      }
    }
  }

  applyCameraBoundsForRoom(room, isTransition = false) {
    const cam = this.scene.cameras.main;
    if (!cam) return;

    const viewportW = cam.width || 960;
    const viewportH = cam.height || 540;

    let { minX, maxX, minY, maxY } = room.bounds;
    let roomW = maxX - minX;
    let roomH = maxY - minY;

    // Ensure room bounds are at least as large as the camera viewport
    let boundX = minX;
    let boundY = minY;
    let boundW = roomW;
    let boundH = roomH;

    if (boundW < viewportW) {
      const diff = viewportW - boundW;
      boundX = Math.max(0, boundX - diff / 2);
      boundW = viewportW;
    }
    if (boundH < viewportH) {
      const diff = viewportH - boundH;
      boundY = Math.max(0, boundY - diff / 2);
      boundH = viewportH;
    }

    // Dynamic player inclusion: if player is near or outside the room box,
    // dynamically stretch the bounds so the player is NEVER clamped off-screen!
    if (this.scene.player) {
      const px = this.scene.player.x;
      const py = this.scene.player.y;
      const margin = 80;

      if (px - margin < boundX) {
        const diff = boundX - (px - margin);
        boundX -= diff;
        boundW += diff;
      }
      if (px + margin > boundX + boundW) {
        boundW = (px + margin) - boundX;
      }

      if (py - margin < boundY) {
        const diff = boundY - (py - margin);
        boundY -= diff;
        boundH += diff;
      }
      if (py + margin > boundY + boundH) {
        boundH = (py + margin) - boundY;
      }

      // If falling fast, extend vertical bottom so camera flows smoothly downwards
      if (this.scene.player.body && this.scene.player.body.velocity.y > 180) {
        boundH = Math.max(boundH, (py + 260) - boundY);
      }
    }

    // Clamp against total world dimensions (5400 x 2500)
    boundX = Phaser.Math.Clamp(boundX, 0, 5400 - boundW);
    boundY = Phaser.Math.Clamp(boundY, 0, 2500 - boundH);
    boundW = Math.min(boundW, 5400 - boundX);
    boundH = Math.min(boundH, 2500 - boundY);

    cam.setBounds(boundX, boundY, boundW, boundH);
  }

  ensurePlayerInCameraView(playerX, playerY) {
    const cam = this.scene.cameras.main;
    if (!cam || !cam.worldView) return;

    // Check if player is outside the visible camera frame
    const wv = cam.worldView;
    const isOutside = playerX < wv.x - 30 || playerX > wv.right + 30 || playerY < wv.y - 30 || playerY > wv.bottom + 30;

    if (isOutside) {
      // Re-center camera immediately on player
      cam.pan(playerX, playerY, 200, 'Linear', true);
    }
  }

  // =========================================================================
  // LOCKDOWN COMBAT TRIAL CHAMBERS
  // =========================================================================
  startTrialLockdown(room) {
    this.activeTrial = room;
    soundFX.playArenaLockdown();
    this.scene.cameras.main.shake(350, 0.018);

    this.scene.events.emit('show_toast', `⚔️ LOCKDOWN TRIAL: ${room.name.toUpperCase()} — DEFEAT ALL ASSAILANTS!`);

    // Slam down entrance and exit iron portcullises
    const { minX, maxX, minY, maxY } = room.bounds;
    const groundY = maxY - 30;

    // Left gate
    const leftGate = this.scene.physics.add.staticSprite(minX + 32, groundY - 96, 'relic_portcullis');
    leftGate.setOrigin(0, 0);
    leftGate.refreshBody();
    this.trialPortcullises.push(leftGate);
    this.scene.physics.add.collider(this.scene.player, leftGate);

    // Right gate
    const rightGate = this.scene.physics.add.staticSprite(maxX - 48, groundY - 96, 'relic_portcullis');
    rightGate.setOrigin(0, 0);
    rightGate.refreshBody();
    this.trialPortcullises.push(rightGate);
    this.scene.physics.add.collider(this.scene.player, rightGate);

    // Spawn trial wave enemies based on biome
    this.spawnTrialWave(room);
  }

  spawnTrialWave(room) {
    const { minX, maxX, maxY } = room.bounds;
    const groundY = maxY - 30;
    const midX = (minX + maxX) / 2;

    this.trialEnemies = [];

    if (room.trialId === 'trial_crypt') {
      // Catacombs Phalanx: 2 Skeleton Knights + 2 Shadow Gargoyles
      const s1 = new (this.scene.getSkeletonClass())(this.scene, midX - 120, groundY - 30);
      const s2 = new (this.scene.getSkeletonClass())(this.scene, midX + 120, groundY - 30);
      const g1 = new (this.scene.getGargoyleClass())(this.scene, midX - 60, groundY - 140);
      const g2 = new (this.scene.getGargoyleClass())(this.scene, midX + 60, groundY - 140);

      [s1, s2, g1, g2].forEach((e) => {
        this.scene.enemies.add(e);
        this.trialEnemies.push(e);
        this.scene.createMagicBurst(e.x, e.y, 0x38bdf8);
      });
    } else if (room.trialId === 'trial_crucible') {
      // Foundry Crucible: 2 Magma Sentinels + 2 Arcane Wisps
      const m1 = new (this.scene.getMagmaSentinelClass())(this.scene, midX - 140, groundY - 30);
      const m2 = new (this.scene.getMagmaSentinelClass())(this.scene, midX + 140, groundY - 30);
      const w1 = new (this.scene.getWispClass())(this.scene, midX - 80, groundY - 120);
      const w2 = new (this.scene.getWispClass())(this.scene, midX + 80, groundY - 120);

      [m1, m2, w1, w2].forEach((e) => {
        this.scene.enemies.add(e);
        this.trialEnemies.push(e);
        this.scene.createMagicBurst(e.x, e.y, 0xf97316);
      });
    } else if (room.trialId === 'trial_stacks') {
      // Spire Stacks: 2 Storm Harpies + 1 Gargoyle + 1 Skeleton
      const h1 = new (this.scene.getHarpyClass())(this.scene, midX - 140, groundY - 120);
      const h2 = new (this.scene.getHarpyClass())(this.scene, midX + 140, groundY - 120);
      const g1 = new (this.scene.getGargoyleClass())(this.scene, midX, groundY - 180);
      const s1 = new (this.scene.getSkeletonClass())(this.scene, midX, groundY - 30);

      [h1, h2, g1, s1].forEach((e) => {
        this.scene.enemies.add(e);
        this.trialEnemies.push(e);
        this.scene.createMagicBurst(e.x, e.y, 0x818cf8);
      });
    }
  }

  updateTrialCombat() {
    // Filter out dead or destroyed enemies
    this.trialEnemies = this.trialEnemies.filter((e) => e && e.active && !e.isDead);

    if (this.trialEnemies.length === 0) {
      this.completeTrial();
    }
  }

  completeTrial() {
    if (!this.activeTrial) return;

    const room = this.activeTrial;
    this.clearedTrials.add(room.trialId);
    this.activeTrial = null;

    soundFX.playArenaCleared();
    this.scene.cameras.main.shake(300, 0.015);

    // Open portcullises
    this.trialPortcullises.forEach((gate) => {
      this.scene.tweens.add({
        targets: gate,
        y: gate.y - 96,
        alpha: 0.2,
        duration: 900,
        onComplete: () => {
          if (gate.body) gate.body.enable = false;
        },
      });
    });
    this.trialPortcullises = [];

    // Spawn Relic Key Reward at center of room
    const { minX, maxX, maxY } = room.bounds;
    const midX = (minX + maxX) / 2;
    const groundY = maxY - 30;

    if (room.rewardKey) {
      this.scene.spawnRelicKey(room.rewardKey, midX, groundY - 48);
    }

    // Spawn bonus soul orbs
    this.scene.spawnSoulOrbs(midX, groundY - 60, 6);

    this.scene.events.emit('show_toast', `🏆 TRIAL CLEARED: ${room.name.toUpperCase()} CONQUERED!`);
    this.scene.events.emit('trial_cleared', room.trialId);
  }

  getCurrentRoom() {
    return this.currentRoom || ROOMS.room_haven;
  }

  getDiscoveredRoomIds() {
    return Array.from(this.discoveredRooms);
  }

  getClearedTrialIds() {
    return Array.from(this.clearedTrials);
  }
}


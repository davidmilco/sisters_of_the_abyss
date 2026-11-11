// SubRegionManager: Real-time spatial tracking of player location within
// named sub-regions, managing discovery banners, HUD location tags, and map fog.

import { SUB_REGIONS } from './WorldData.js';

export class SubRegionManager {
  constructor(scene) {
    this.scene = scene;
    this.currentSubRegion = null;
    this.discoveredSubRegions = new Set();
    this.lastCheckTime = 0;
  }

  init(savedDiscoveredIds = []) {
    this.discoveredSubRegions = new Set(savedDiscoveredIds || []);
    // Always start with Haven discovered
    this.discoveredSubRegions.add('catacombs_haven');
  }

  update(playerX, playerY) {
    const now = this.scene.time.now;
    if (now - this.lastCheckTime < 100) return;
    this.lastCheckTime = now;

    const matched = this.findSubRegionAt(playerX, playerY);
    if (!matched) return;

    if (!this.currentSubRegion || this.currentSubRegion.id !== matched.id) {
      const isFirstDiscovery = !this.discoveredSubRegions.has(matched.id);
      this.discoveredSubRegions.add(matched.id);
      this.currentSubRegion = matched;

      // Emit event to GameScene and UIScene
      this.scene.events.emit('subregion_changed', {
        subRegion: matched,
        isFirstDiscovery,
      });
    }
  }

  findSubRegionAt(x, y) {
    // 1. If currently in a sub-region and still within bounds + 24px margin, retain it (hysteresis)
    if (this.currentSubRegion) {
      const { minX, maxX, minY, maxY } = this.currentSubRegion.bounds;
      if (x >= minX - 24 && x <= maxX + 24 && y >= minY - 24 && y <= maxY + 24) {
        return this.currentSubRegion;
      }
    }

    // 2. Check specific sub-region boundaries
    for (const key in SUB_REGIONS) {
      const reg = SUB_REGIONS[key];
      const { minX, maxX, minY, maxY } = reg.bounds;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return reg;
      }
    }

    // 3. Fallback: Determine closest sub-region by Euclidean distance to bounding box
    let closestSubRegion = this.currentSubRegion || SUB_REGIONS.catacombs_haven;
    let minDistanceSq = Infinity;

    for (const key in SUB_REGIONS) {
      const reg = SUB_REGIONS[key];
      const { minX, maxX, minY, maxY } = reg.bounds;
      const dx = Math.max(0, minX - x, x - maxX);
      const dy = Math.max(0, minY - y, y - maxY);
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestSubRegion = reg;
      }
    }

    return closestSubRegion;
  }

  getCurrentSubRegion() {
    return this.currentSubRegion || SUB_REGIONS.catacombs_haven;
  }

  getDiscoveredIds() {
    return Array.from(this.discoveredSubRegions);
  }
}

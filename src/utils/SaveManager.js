// SaveManager: Persistent Storage for Abyssal Blade Metroidvania
// Automatically manages serialization and loading of player progress, unlocked sisters, abilities, keepsakes, and exploration.

const SAVE_STORAGE_KEY = 'abyssal_blade_save_v1';

export class SaveManager {
  static hasSave() {
    try {
      return localStorage.getItem(SAVE_STORAGE_KEY) !== null;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }

  static getSaveData() {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse save data:', e);
      return null;
    }
  }

  static saveGame(data) {
    try {
      const payload = {
        version: 1,
        savedAt: Date.now(),
        leadSisterId: data.leadSisterId || 'wren',
        rescuedSisterIds: Array.from(data.rescuedSisterIds || []),
        unlockedAbilities: data.unlockedAbilities || {},
        collectedKeepsakes: Array.from(data.collectedKeepsakes || []),
        health: data.health || 100,
        maxHealth: data.maxHealth || 100,
        soul: data.soul || 100,
        maxSoul: data.maxSoul || 100,
        discoveredCells: Array.from(data.discoveredCells || []),
        discoveredSubRegions: Array.from(data.discoveredSubRegions || []),
        discoveredLeylineIds: Array.from(data.discoveredLeylineIds || []),
        collectedSigils: Array.from(data.collectedSigils || []),
        collectedKeys: Array.from(data.collectedKeys || []),
        openedDoors: Array.from(data.openedDoors || []),
        discoveredRooms: Array.from(data.discoveredRooms || []),
        clearedTrials: Array.from(data.clearedTrials || []),
        currentBiome: data.currentBiome || 'catacombs',
        bossDefeated: !!data.bossDefeated,
        playerX: data.playerX || 800,
        playerY: data.playerY || 1580,
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('Failed to write save data to localStorage:', e);
      return false;
    }
  }

  static clearSave() {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Failed to clear save data:', e);
      return false;
    }
  }
}

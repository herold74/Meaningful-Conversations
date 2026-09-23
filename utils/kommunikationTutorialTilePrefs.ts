export type KommunikationTutorialTilePosition = 'first' | 'last';

const STORAGE_KEY = 'kommunikationTutorialTilePosition';
export const KOMMUNIKATION_TUTORIAL_TILE_POSITION_EVENT = 'mc-kommunikation-tutorial-tile-position';

export function getKommunikationTutorialTilePosition(): KommunikationTutorialTilePosition {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'last' ? 'last' : 'first';
  } catch {
    return 'first';
  }
}

export function setKommunikationTutorialTilePosition(position: KommunikationTutorialTilePosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, position);
    window.dispatchEvent(new CustomEvent(KOMMUNIKATION_TUTORIAL_TILE_POSITION_EVENT));
  } catch {
    /* ignore */
  }
}

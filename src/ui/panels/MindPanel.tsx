import { memo } from 'react';

/**
 * Mind tab panel (Sprint 3.6.1 shell).
 *
 * Intentionally renders nothing when the player is on the default
 * "home" Mind tab — the canvas + HUD behind should stay visible and
 * tappable, which is how a first-open player generates thoughts.
 *
 * Sprint 4b adds the first subtab content (Pattern Tree). Sprints 5 /
 * 6 / 7 / 8b add Archetypes / Neural Diary / Achievements / Resonance
 * subtabs. At that point this component will host a subtab router.
 */
export const MindPanel = memo(function MindPanel() {
  return null;
});

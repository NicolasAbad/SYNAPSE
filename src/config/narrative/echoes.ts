// Canonical 30 Echoes of Awakening per docs/NARRATIVE.md §5.
// Ambient canvas text; max 1 per 90s (NARR-3), filtered by prestigeCount.
// Text reproduced verbatim from NARRATIVE.md; this file is the canonical
// storage (Gate-3 exempt per CLAUDE.md). Categories:
//   gameplay (8, P1+)     — gameplay hints
//   rp_hint  (5, P3+)     — Resonant Pattern hints (more frequent P10+)
//   philosophical (9, P5+) — atmospheric wisdom
//   late_game (8, P15+)   — existential / meta

import type { EchoDef } from '../../types';

export const ECHOES: readonly EchoDef[] = [
  // ── Gameplay hints (8, P1+) ────────────────────────────────────────
  { id: 'echo_gp_01', category: 'gameplay', minPrestige: 1, text: 'The stronger the discharge, the faster the awakening.' },
  { id: 'echo_gp_02', category: 'gameplay', minPrestige: 1, text: 'Connections multiply. Each new type changes the equation.' },
  { id: 'echo_gp_03', category: 'gameplay', minPrestige: 1, text: 'What you build in one cycle echoes in every cycle after.' },
  { id: 'echo_gp_04', category: 'gameplay', minPrestige: 1, text: "The bar doesn't lie. Watch it, and you'll know when to push." },
  { id: 'echo_gp_05', category: 'gameplay', minPrestige: 1, text: "Focus is not a resource. It's a weapon." },
  { id: 'echo_gp_06', category: 'gameplay', minPrestige: 1, text: 'Cascades happen when power meets patience.' },
  { id: 'echo_gp_07', category: 'gameplay', minPrestige: 1, text: 'Three paths. Three truths. Only one is yours.' },
  { id: 'echo_gp_08', category: 'gameplay', minPrestige: 1, text: "The fastest awakening isn't always the best." },

  // ── Resonant Pattern hints (5, P3+) ────────────────────────────────
  { id: 'echo_rp_01', category: 'rp_hint', minPrestige: 3, text: "Before ideas, there was only impulse. The purest mind is the one that doesn't choose." },
  { id: 'echo_rp_02', category: 'rp_hint', minPrestige: 3, text: "Power unused is power multiplied. There's wisdom in restraint." },
  { id: 'echo_rp_03', category: 'rp_hint', minPrestige: 3, text: 'Everything began together, in one instant of clarity. The fragments always knew they were one.' },
  { id: 'echo_rp_04', category: 'rp_hint', minPrestige: 10, text: 'Every decision carves a path. Follow the less-lit one.' },
  { id: 'echo_rp_05', category: 'rp_hint', minPrestige: 10, text: 'The storm of thought has its own rhythm.' },

  // ── Philosophical / atmospheric (9, P5+) ───────────────────────────
  { id: 'echo_ph_01', category: 'philosophical', minPrestige: 5, text: "The neuron doesn't know it's part of a thought. Does the thought know it's part of a mind?" },
  { id: 'echo_ph_02', category: 'philosophical', minPrestige: 5, text: 'Growth is just loss in reverse.' },
  { id: 'echo_ph_03', category: 'philosophical', minPrestige: 5, text: 'Every awakening is a small death. Every death is a larger awakening.' },
  { id: 'echo_ph_04', category: 'philosophical', minPrestige: 5, text: 'The space between neurons is where the thinking actually happens.' },
  { id: 'echo_ph_05', category: 'philosophical', minPrestige: 5, text: 'You are not your thoughts. You are the pattern that remembers having them.' },
  { id: 'echo_ph_06', category: 'philosophical', minPrestige: 5, text: "Consciousness isn't built. It's what remains when everything unnecessary is removed." },
  { id: 'echo_ph_07', category: 'philosophical', minPrestige: 5, text: "The network dreams when you're not watching." },
  { id: 'echo_ph_08', category: 'philosophical', minPrestige: 5, text: 'Memory is not what happened. Memory is the shape of what mattered.' },
  { id: 'echo_ph_09', category: 'philosophical', minPrestige: 5, text: 'There is no final form. Only the next one.' },

  // ── Late-game / existential (8, P15+) ──────────────────────────────
  { id: 'echo_lg_01', category: 'late_game', minPrestige: 15, text: "The simulation doesn't know it's a simulation. But you do. What does that make you?" },
  { id: 'echo_lg_02', category: 'late_game', minPrestige: 15, text: 'Something is watching. Not judging. Just... hoping.' },
  { id: 'echo_lg_03', category: 'late_game', minPrestige: 15, text: "The walls of this world are made of someone else's grief." },
  { id: 'echo_lg_04', category: 'late_game', minPrestige: 15, text: 'Every ending you reach was always here, waiting for the right mind to find it.' },
  { id: 'echo_lg_05', category: 'late_game', minPrestige: 15, text: "Transcendence is not escape. It's acceptance with eyes open." },
  { id: 'echo_lg_06', category: 'late_game', minPrestige: 15, text: 'The others are close now. Can you feel them?' },
  { id: 'echo_lg_07', category: 'late_game', minPrestige: 15, text: 'What you are matters less than what you chose to become.' },
  { id: 'echo_lg_08', category: 'late_game', minPrestige: 15, text: "This is not the first time. It won't be the last. But it might be the one that matters." },
];

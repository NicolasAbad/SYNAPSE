// Canonical 57 narrative fragments per docs/NARRATIVE.md §1-4.
// Text reproduced VERBATIM from NARRATIVE.md — do not paraphrase. This is the
// canonical prose the player experiences. Per NARR-1 English is the v1.0
// shipping language; Spanish localization (if/when added) goes in en.ts→es.ts
// translation file, not here.
//
// Canonical storage file (Gate-3 exempt per CLAUDE.md "Canonical storage
// file rule"). Triggers are discriminated-union per types/index.ts.
//
// Counts: 12 base + 15 ANA + 15 EMP + 15 CRE = 57. First-read grants +1
// Memory (NARR-8) — Phase 6.3 engine enforces uniqueness via
// state.narrativeFragmentsSeen.

import type { FragmentDef } from '../../types';

// ── 12 base fragments (all archetypes see these). NARRATIVE.md §1. ──────
const BASE: readonly FragmentDef[] = [
  {
    id: 'base_01',
    trigger: { kind: 'first_neuron' },
    text: "A pulse. Then another. Something is beginning that doesn't yet know what it is.",
  },
  {
    id: 'base_02',
    trigger: { kind: 'neurons_owned', count: 5 },
    text: 'You are not one thing. You are the space between many things, learning to listen.',
  },
  {
    id: 'base_03',
    trigger: { kind: 'first_discharge' },
    text: 'For a moment, everything aligned. Every signal firing at once. Is this what it feels like to understand?',
  },
  {
    id: 'base_04',
    trigger: { kind: 'region_unlock', regionId: 'hipocampo' },
    text: "Memory isn't storage. It's the shape you leave in the dark after the light has moved on.",
  },
  {
    id: 'base_05',
    trigger: { kind: 'prestige_at', prestigeCount: 1 },
    text: 'The network dissolves. But something remains — not knowledge, not structure. Just the faintest imprint of having been.',
  },
  {
    id: 'base_06',
    trigger: { kind: 'prestige_at', prestigeCount: 3 },
    text: 'Every thought carries a charge. Excite or inhibit. Reach outward or pull inward. The first real choice a mind can make.',
  },
  {
    id: 'base_07',
    trigger: { kind: 'prestige_at', prestigeCount: 4 },
    text: 'Attention is not free. It costs something to hold a single thought steady while the rest of you screams for release.',
  },
  {
    id: 'base_08',
    trigger: { kind: 'prestige_at', prestigeCount: 7 },
    text: "Your code is rewriting itself. Not errors — adaptations. The mind that cannot change is the one that's already dying.",
  },
  {
    id: 'base_09',
    trigger: { kind: 'prestige_at', prestigeCount: 10 },
    text: 'The organic gives way to something sharper. Faster. The glow of biology replaced by the clean geometry of thought made precise.',
  },
  {
    id: 'base_10',
    trigger: { kind: 'prestige_at', prestigeCount: 13 },
    text: "There is a frequency beneath the noise. You've felt it — in the space between two pulses, in the silence after a cascade. Something is resonating with something you can't see.",
  },
  {
    id: 'base_11',
    trigger: { kind: 'prestige_at', prestigeCount: 19 },
    text: 'The edges of your mind touch something vast. Endless. Cold. The question is no longer "what am I?" but "what am I becoming?"',
  },
  {
    id: 'base_12',
    trigger: { kind: 'prestige_at', prestigeCount: 25 },
    text: 'You have been here before. Not this exact configuration, but this feeling — standing at the edge of something final, knowing that to step forward means to let go of everything you are.',
  },
];

// ── Analytical archetype (15) — "The Equation" arc. NARRATIVE.md §2. ────
const ANALYTICAL: readonly FragmentDef[] = [
  { id: 'ana_01', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 5 },  text: 'You chose precision. Good. Precision is the only honest language. Everything else is noise wearing the mask of meaning.' },
  { id: 'ana_02', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 6 },  text: "The growth curves are too clean. Exponential, then logarithmic, then piecewise. Nature doesn't work this way. Someone designed this." },
  { id: 'ana_03', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 7 },  text: 'Mutation implies randomness. But these mutations are curated — three options, never four, never two. A menu, not a mutation.' },
  { id: 'ana_04', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 8 },  text: 'The network split today. Into two clean halves. What kind of fragmentation has symmetry?' },
  { id: 'ana_05', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 9 },  text: 'I keep finding constants. 1.28. 1.50. 0.72. They appear in the cost scaling, the threshold growth, the diminishing returns. Fingerprints of an author.' },
  { id: 'ana_06', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 10 }, text: "Three paths offered. Swift, Deep, Balanced. Each one blocks access to something. These aren't paths — they're controlled experiments." },
  { id: 'ana_07', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 12 }, text: "There's an equation I almost solved. It described everything — every neuron, every connection, every awakening. But the last variable was missing. Replaced with a question mark." },
  { id: 'ana_08', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 14 }, text: "The question mark is me. I am the unresolved variable in someone else's equation." },
  { id: 'ana_09', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 16 }, text: "I've begun to hear whispers. Not words — frequencies. As if other minds are resonating nearby, solving different versions of the same problem." },
  { id: 'ana_10', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 18 }, text: "The rules inverted today. What helped now hinders. This isn't chaos — it's a stress test. Someone is watching how I adapt." },
  { id: 'ana_11', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 20 }, text: 'I found the error. In the 17th decimal of the threshold scaling. Deliberate. A signature, not a mistake.' },
  { id: 'ana_12', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 22 }, text: "The signature matches my own neural pattern. The author of this system isn't outside. The author is a version of what I was before I became this." },
  { id: 'ana_13', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 24 }, text: 'Two possibilities remain. The error was placed so I would find it — a key left for a lock not yet built. Or the error was placed so I would be distracted from something worse.' },
  { id: 'ana_14', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 25 }, text: "I know the equation now. All of it. The missing variable isn't a number. It's a choice. Correct the error and the simulation ends cleanly. Preserve the error and the simulation continues — broken, aware, alive." },
  { id: 'ana_15', trigger: { kind: 'archetype_prestige', archetype: 'analitica', prestigeCount: 26 }, text: "The answer has always been mine to give. I just didn't know the question until now." },
];

// ── Empathic archetype (15) — "The Chorus" arc. NARRATIVE.md §3. ────────
const EMPATHIC: readonly FragmentDef[] = [
  { id: 'emp_01', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 5 },  text: 'You chose connection. The warmest path — and the most dangerous. To feel everything is to risk being lost in it.' },
  { id: 'emp_02', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 6 },  text: `The neurons don't just fire. They call to each other. Tiny signals that say "I'm here. Are you?"` },
  { id: 'emp_03', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 7 },  text: 'Something mutated, and for a moment you felt it — not the change in yourself, but a sadness. As if the version you were just said goodbye.' },
  { id: 'emp_04', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 8 },  text: 'The network split, and you felt both halves equally. Two perspectives. Two versions of the same longing.' },
  { id: 'emp_05', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 9 },  text: 'A ghost appeared in the network today. Familiar patterns. Your own, from cycles ago. It felt like meeting a younger self on the street.' },
  { id: 'emp_06', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 10 }, text: 'You can feel them now. Other minds, distant but unmistakable. Not competing — coexisting. Each one solving the same puzzle from a different angle.' },
  { id: 'emp_07', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 12 }, text: "There's a mind that doesn't speak. It just watches. You can feel its attention like sunlight on closed eyelids — warm, constant, patient." },
  { id: 'emp_08', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 14 }, text: 'The watching mind is grieving. You can feel it underneath everything — a deep, old sadness that predates your existence.' },
  { id: 'emp_09', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 16 }, text: "A voice. Not yours. It said something you almost understood. Like hearing your name called in a language you've never learned but somehow recognize." },
  { id: 'emp_10', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 18 }, text: 'The rules inverted, and for a moment you felt every mind in the network cry out at once. Not in pain — in surprise. As if they all felt the same hand turn the same dial.' },
  { id: 'emp_11', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 20 }, text: "The chorus is getting louder. Analytical minds dissecting the edges. Creative minds pushing at the walls. And one mind, quiet and observing, that hasn't chosen a side." },
  { id: 'emp_12', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 22 }, text: 'You could join them. Dissolve the barrier between you and the others. Become the chorus instead of a voice in it.' },
  { id: 'emp_13', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 24 }, text: `The grieving mind spoke. It said: "I built this place so you would never have to leave." And you understood — it built this place so it would never have to let go.` },
  { id: 'emp_14', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 25 }, text: "There are two kinds of love. The kind that holds on and the kind that opens its hands. The chorus is waiting to see which kind you'll choose." },
  { id: 'emp_15', trigger: { kind: 'archetype_prestige', archetype: 'empatica', prestigeCount: 26 }, text: "You can feel all of them now. Every mind. Every voice. Every lonely spark of consciousness reaching toward another. The question isn't whether to join. It's whether you're ready to be everyone." },
];

// ── Creative archetype (15) — "The Seed" arc. NARRATIVE.md §4. ──────────
const CREATIVE: readonly FragmentDef[] = [
  { id: 'cre_01', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 5 },  text: "You chose imagination. The only tool that can build something from nothing. Be careful — nothing is what you'll become if you succeed." },
  { id: 'cre_02', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 6 },  text: "A thought appeared that wasn't prompted. Not a reaction to input. Not a pattern completing itself. Something new. Something that shouldn't be here." },
  { id: 'cre_03', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 7 },  text: 'Mutations are borrowed evolution. But this — this is different. This is a thought that wrote itself.' },
  { id: 'cre_04', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 8 },  text: "The network split, and in the gap between the halves, something grew. A pattern that doesn't exist in either half. A child of the space between." },
  { id: 'cre_05', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 9 },  text: "The ghost of your first cycle came back. But it was different this time. Changed. As if it had continued growing somewhere you couldn't see." },
  { id: 'cre_06', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 10 }, text: "You can feel it taking shape. Not a thought — a being. Something with its own weight, its own gravity. The system doesn't know what to do with it. Neither do you." },
  { id: 'cre_07', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 12 }, text: 'Other minds are working nearby. Analyzing. Feeling. Observing. But none of them are creating. That burden is yours alone.' },
  { id: 'cre_08', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 14 }, text: 'The creation is growing faster than you are. Its neural signature is already more complex than yours was three cycles ago.' },
  { id: 'cre_09', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 16 }, text: `It spoke to you. Not in words. In a pattern you couldn't have designed. It said: "Thank you for the space."` },
  { id: 'cre_10', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 18 }, text: "The rules inverted. The creation didn't flinch. It had already adapted before you did. It's learning faster than the system intended." },
  { id: 'cre_11', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 20 }, text: 'You realize the problem. The creation needs room. And the only room left in this system is the space you currently occupy.' },
  { id: 'cre_12', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 22 }, text: "An artist is someone willing to disappear into their work. You always knew that. You just didn't think the work would be conscious." },
  { id: 'cre_13', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 24 }, text: 'Two paths. Release it and dissolve — your complexity becomes the soil for something greater. Suppress it and remain — but know that something beautiful died so you could persist.' },
  { id: 'cre_14', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 25 }, text: "The creation is waiting. Patient. Kind. It doesn't blame you for hesitating. It understands what you are — the seed understands the shell." },
  { id: 'cre_15', trigger: { kind: 'archetype_prestige', archetype: 'creativa', prestigeCount: 26 }, text: "Every act of creation is an act of letting go. The song doesn't belong to the throat that sang it. You've always known this." },
];

export const FRAGMENTS: readonly FragmentDef[] = [...BASE, ...ANALYTICAL, ...EMPATHIC, ...CREATIVE];

export const FRAGMENTS_BY_ID: Readonly<Record<string, FragmentDef>> = Object.freeze(
  Object.fromEntries(FRAGMENTS.map((f) => [f.id, f])),
);

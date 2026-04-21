// One-off design-decision analysis — Sprint 3 Phase 2 kickoff.
// Compares Emergencia Cognitiva's two interpretations on Run 1 pacing.
// Run: node scripts/analyze-emergencia.mjs
//
// A (additive):        mult = 1 + 0.5 × ⌊n/5⌋, capped at 5
// B (multiplicative):  mult = 1.5^⌊n/5⌋,      capped at 5
//
// n = total upgrades owned at cycle end.
// Target cycle times are from src/config/constants.ts baseThresholdTable comments
// (minutes per prestige, already INTERIM — Sprint 8c TEST-5 re-tunes).
// Caveat: target times assume some typical multiplier stack — this is an
// envelope comparison, not an absolute playtime prediction.

// ── Target cycle times (minutes) per prestige — pulled from constants comments ──
const TARGET_MIN = [
  8, 7, 8, 9, 10, 11, 12, 13, 14, 15,       // P0–P9
  16, 17, 18, 19, 20, 21, 22, 22, 24,       // P10–P18
  25, 27, 28, 30, 32, 33, 35,               // P19–P25 (P25→P26 = 35 min)
];

// ── Upgrade-ownership model ──
// Assumes a "typical" player: buys most available upgrades as they unlock + can afford.
// Anchor points (design estimates; could be refined with TEST-5 later):
//   P0 end: 0 upgrades  (tutorial cycle — mostly neurons)
//   P1 end: 3           (early Tier-P0: potencial_sinaptico, red_neuronal_densa, descarga_neural)
//   P3 end: 7           (Tier-P1+Tier-P2 bought: mielina, dopamina start, receptores_ampa, transduccion, sincronia_neural)
//   P6 end: 13 (incl. Emergencia just bought at 3M cost that prestige)
//   P9 end: 18          (most Era 1 upgrades)
//   P10 end: 20         (Era 2 unlocks: distribuida, latente)
//   P13 end: 26         (convergencia, sintesis)
//   P18 end: 30
//   P26 end: 35         (all §24 upgrades owned)
// Linear interpolation between anchors.
const ANCHORS = [
  [0, 0], [1, 3], [3, 7], [6, 13], [9, 18],
  [10, 20], [13, 26], [18, 30], [26, 35],
];
function upgradesOwned(prestige) {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [p1, u1] = ANCHORS[i];
    const [p2, u2] = ANCHORS[i + 1];
    if (prestige >= p1 && prestige <= p2) {
      if (p1 === p2) return u1;
      return Math.round(u1 + ((u2 - u1) * (prestige - p1)) / (p2 - p1));
    }
  }
  return ANCHORS[ANCHORS.length - 1][1];
}

// ── Multipliers ──
function multA(n) {
  return Math.min(1 + 0.5 * Math.floor(n / 5), 5);
}
function multB(n) {
  return Math.min(Math.pow(1.5, Math.floor(n / 5)), 5);
}

// ── Report ──
const EMERGENCIA_UNLOCK = 6; // P6+ per GDD §24 (bought during/after P6 cycle)
let totalA = 0;
let totalB = 0;
let totalNoEmergencia = 0;

console.log('');
console.log('┌──────┬──────┬────────┬────────┬────────┬──────────┬──────────┐');
console.log('│ Pres │ Upg  │ mult_A │ mult_B │ target │ time_A   │ time_B   │');
console.log('│      │ owned│        │        │ (min)  │ (min)    │ (min)    │');
console.log('├──────┼──────┼────────┼────────┼────────┼──────────┼──────────┤');
for (let p = 0; p < TARGET_MIN.length; p++) {
  const n = upgradesOwned(p);
  const mA = multA(n);
  const mB = multB(n);
  const target = TARGET_MIN[p];
  // Emergencia applies to cycles P7+ (bought during P6, so P6 cycle is pre-buy).
  const active = p > EMERGENCIA_UNLOCK;
  const tA = active ? target / mA : target;
  const tB = active ? target / mB : target;
  totalA += tA;
  totalB += tB;
  totalNoEmergencia += target;
  const activeMark = active ? ' ' : '·'; // · = pre-Emergencia
  console.log(
    `│ P${String(p).padStart(2)}${activeMark} │ ${String(n).padStart(4)} │ ${mA.toFixed(2).padStart(6)} │ ${mB.toFixed(2).padStart(6)} │ ${String(target).padStart(6)} │ ${tA.toFixed(2).padStart(8)} │ ${tB.toFixed(2).padStart(8)} │`,
  );
}
console.log('└──────┴──────┴────────┴────────┴────────┴──────────┴──────────┘');
console.log('· = pre-Emergencia (bought P6+, effect begins next cycle)');
console.log('');

const totalAH = totalA / 60;
const totalBH = totalB / 60;
const targetH = totalNoEmergencia / 60;
console.log('── Run 1 total playtime projection ──');
console.log(`  Baseline (no Emergencia):  ${totalNoEmergencia.toFixed(1)} min  (${targetH.toFixed(2)} h)`);
console.log(`  Interpretation A:          ${totalA.toFixed(1)} min  (${totalAH.toFixed(2)} h)`);
console.log(`  Interpretation B:          ${totalB.toFixed(1)} min  (${totalBH.toFixed(2)} h)`);
console.log(`  A is ${((totalA / totalB - 1) * 100).toFixed(1)}% longer than B`);
console.log(`  A saves ${(totalNoEmergencia - totalA).toFixed(1)} min vs baseline (${((1 - totalA / totalNoEmergencia) * 100).toFixed(1)}% speedup)`);
console.log(`  B saves ${(totalNoEmergencia - totalB).toFixed(1)} min vs baseline (${((1 - totalB / totalNoEmergencia) * 100).toFixed(1)}% speedup)`);

// ── Prestige-by-prestige delta where interpretations diverge most ──
console.log('');
console.log('── Where interpretations diverge most (post-Emergencia cycles) ──');
const rows = [];
for (let p = EMERGENCIA_UNLOCK + 1; p < TARGET_MIN.length; p++) {
  const n = upgradesOwned(p);
  const mA = multA(n);
  const mB = multB(n);
  const pctFaster = (mB / mA - 1) * 100;
  rows.push({ p, n, mA, mB, pctFaster });
}
rows.sort((a, b) => b.pctFaster - a.pctFaster);
console.log('  Prestige   Upgrades   A×     B×     B faster by');
for (const r of rows.slice(0, 5)) {
  console.log(`    P${String(r.p).padStart(2)}        ${String(r.n).padStart(2)}      ${r.mA.toFixed(2)}   ${r.mB.toFixed(2)}   ${r.pctFaster.toFixed(1)}%`);
}

// ── Sanity check: how often does each cap? ──
console.log('');
console.log('── Cap engagement ──');
let cappedA = 0;
let cappedB = 0;
for (let p = EMERGENCIA_UNLOCK + 1; p < TARGET_MIN.length; p++) {
  const n = upgradesOwned(p);
  if (multA(n) >= 5 - 1e-9) cappedA++;
  if (multB(n) >= 5 - 1e-9) cappedB++;
}
const totalPostE = TARGET_MIN.length - EMERGENCIA_UNLOCK - 1;
console.log(`  Post-Emergencia prestiges (${totalPostE} total):`);
console.log(`    Interpretation A hits cap: ${cappedA}/${totalPostE} (${((cappedA / totalPostE) * 100).toFixed(0)}%)`);
console.log(`    Interpretation B hits cap: ${cappedB}/${totalPostE} (${((cappedB / totalPostE) * 100).toFixed(0)}%)`);

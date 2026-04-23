// Economy-sanity projector — Sprint 3 Phase 3.5 audit hedge.
// Run: node scripts/economy-sanity.mjs
//
// Hedges Sprint 8c TEST-5 by projecting cycle times across P0-P25 for Run 1
// with typical upgrade adoption. Flags prestiges >25% off the target minutes
// documented in src/config/constants.ts baseThresholdTable comments.
//
// MODEL CAVEATS (why this is an envelope tool, not TEST-5):
//   1. Uses END-of-cycle neuron counts. Actual player grows neurons DURING
//      the cycle, so real average rate is lower. We apply AVG_RATE_FRACTION
//      to approximate "mean rate during cycle" (0.4 = hand-calibrated against
//      the post-Batch-3 4A-1 sim outputs that produced the current thresholds).
//   2. Doesn't model momentumBonus head-start, Mutations, Archetypes, Pathways.
//   3. Assumes player buys most affordable-available upgrades each cycle.
//   4. The RELATIVE shape across prestiges (which ones drift) is the signal.
//      Absolute per-prestige minutes are coarse ± 40%.
//
// Sprint 8c TEST-5 remains authoritative for balance decisions.

const AVG_RATE_FRACTION = 0.4;

// ── Target cycle times (minutes) from baseThresholdTable comments ──
const TARGET_MIN = [
  8, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 22, 24,
  25, 27, 28, 30, 32, 33, 35,
];
const THRESHOLDS = [
  800_000, 450_000, 1_000_000, 2_000_000, 3_500_000, 5_000_000, 7_500_000,
  11_000_000, 16_000_000, 35_000_000, 65_000_000, 95_000_000, 135_000_000,
  180_000_000, 250_000_000, 340_000_000, 450_000_000, 580_000_000, 800_000_000,
  1_100_000_000, 1_500_000_000, 2_000_000_000, 2_800_000_000, 3_800_000_000,
  5_200_000_000, 7_000_000_000,
];
const TUTORIAL_THRESHOLD = 25_000; // Sprint 3 Phase 7.4b retune (was 50_000)

// ── Upgrade adoption anchors (prestige → total upgrades owned by cycle end) ──
const ANCHORS = [[0, 0], [1, 3], [3, 7], [6, 13], [9, 18], [10, 20], [13, 26], [18, 30], [26, 35]];
function upgradesOwned(p) {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [p1, u1] = ANCHORS[i]; const [p2, u2] = ANCHORS[i + 1];
    if (p >= p1 && p <= p2) return p1 === p2 ? u1 : Math.round(u1 + (u2 - u1) * (p - p1) / (p2 - p1));
  }
  return ANCHORS[ANCHORS.length - 1][1];
}

// ── Typical neuron counts per prestige (end-of-cycle snapshot) ──
// Player scales neurons to satisfy threshold; counts below are calibrated
// roughly to match target cycle times if multipliers stack as expected.
function typicalNeurons(p) {
  if (p <= 1) return { basica: 20, sensorial: 3, piramidal: 0, espejo: 0, integradora: 0 };
  if (p <= 3) return { basica: 50, sensorial: 15, piramidal: 2, espejo: 0, integradora: 0 };
  if (p <= 6) return { basica: 80, sensorial: 30, piramidal: 10, espejo: 1, integradora: 0 };
  if (p <= 9) return { basica: 120, sensorial: 50, piramidal: 25, espejo: 5, integradora: 0 };
  if (p <= 13) return { basica: 150, sensorial: 70, piramidal: 40, espejo: 15, integradora: 3 };
  if (p <= 18) return { basica: 180, sensorial: 90, piramidal: 60, espejo: 25, integradora: 10 };
  return { basica: 220, sensorial: 120, piramidal: 80, espejo: 40, integradora: 20 };
}

const NEURON_BASE_RATE = { basica: 0.5, sensorial: 4.5, piramidal: 32, espejo: 220, integradora: 1_800 };

// ── Multiplier stack: all-neurons mults + per-type mults (from §24 typical kit) ──
// At each prestige, assume player owns the "expected" subset of upgrades.
function estimateAllNeuronsMult(p) {
  // P0+: red_neuronal_densa (×1.25); P3+: LTP (×1.5); P5+: neurogenesis (×1.10)
  let m = 1;
  if (p >= 0) m *= 1.25; // red_neuronal_densa
  if (p >= 3) m *= 1.5; // ltp
  if (p >= 5) m *= 1.10; // neurogenesis
  return m;
}
function estimatePerTypeMult(type, p) {
  let m = 1;
  if (type === 'basica' && p >= 1) m *= 2; // receptores_ampa
  if (type === 'sensorial' && p >= 1) m *= 3; // transduccion_sensorial
  if (type === 'piramidal' && p >= 2) m *= 3; // axones_proyeccion
  if (type === 'espejo' && p >= 2) m *= 4; // espejo_resonantes
  // Sprint 7.5.2 §16.8: consolidacion_memoria retired (was ×3 basica). Removed
  // from this projector — no surviving thoughts-cost upgrade replicates the
  // standalone basica ×3 effect at P0. Acervo de Memorias (Sprint 6.8 Wave 2,
  // P5+) replaces the Memorias-acceleration channel via memory_per_prestige.
  return m;
}
function estimateConnectionMult(neurons, p) {
  const owned = Object.values(neurons).filter((c) => c > 0).length;
  const pairs = owned < 2 ? 0 : (owned * (owned - 1)) / 2;
  let base = 1 + 0.05 * pairs;
  if (p >= 2) base *= 2; // sincronia_neural typical
  return base;
}
function estimateGlobalUpgradeMult(p, lp) {
  let m = 1;
  if (p >= 6) m *= 2; // retroalimentacion_positiva
  if (p >= 6) {
    const buckets = Math.floor(upgradesOwned(p) / 5);
    m *= Math.min(Math.pow(1.5, buckets), 5); // emergencia_cognitiva (B)
  }
  if (p >= 8) m *= Math.pow(1.01, p); // singularidad
  if (p >= 10) m *= 1 + Math.min(0.015 * lp, 0.40); // convergencia_sinaptica
  return m;
}

function softCap(x) { return x <= 100 ? x : 100 * Math.pow(x / 100, 0.72); }

function projectEffectiveRate(p, lifetimePrestiges) {
  const neurons = typicalNeurons(p);
  const allMult = estimateAllNeuronsMult(p);
  let sum = 0;
  for (const [type, count] of Object.entries(neurons)) {
    sum += count * NEURON_BASE_RATE[type] * allMult * estimatePerTypeMult(type, p);
  }
  const connection = estimateConnectionMult(neurons, p);
  const global = estimateGlobalUpgradeMult(p, lifetimePrestiges);
  const raw = connection * global;
  const final = softCap(raw);
  return sum * final * AVG_RATE_FRACTION;
}

// ── Report ──
console.log('');
console.log('SYNAPSE economy-sanity projector — Run 1');
console.log('════════════════════════════════════════');
console.log('');
console.log('┌──────┬───────────────┬───────┬──────────┬──────────┬─────────┐');
console.log('│ Pres │ threshold     │ tgt   │ est rate │ proj min │ Δ vs tgt │');
console.log('├──────┼───────────────┼───────┼──────────┼──────────┼─────────┤');
let totalTarget = 0; let totalProj = 0; let flags = 0;
for (let p = 0; p < THRESHOLDS.length; p++) {
  const thresh = p === 0 ? TUTORIAL_THRESHOLD : THRESHOLDS[p];
  const target = TARGET_MIN[p];
  const rate = projectEffectiveRate(p, p);
  const projSec = thresh / rate;
  const projMin = projSec / 60;
  const delta = ((projMin - target) / target) * 100;
  const flag = Math.abs(delta) > 25 ? '⚠️' : ' ';
  if (Math.abs(delta) > 25) flags++;
  totalTarget += target;
  totalProj += projMin;
  const threshDisplay = thresh >= 1e9 ? `${(thresh / 1e9).toFixed(1).padStart(6)}B` : thresh >= 1e6 ? `${(thresh / 1e6).toFixed(1).padStart(6)}M` : `${(thresh / 1e3).toFixed(0).padStart(6)}K`;
  console.log(`│ P${String(p).padStart(2)}${flag} │ ${threshDisplay.padStart(13)} │ ${String(target).padStart(5)} │ ${rate.toFixed(1).padStart(8)} │ ${projMin.toFixed(1).padStart(8)} │ ${delta.toFixed(1).padStart(6)}% │`);
}
console.log('└──────┴───────────────┴───────┴──────────┴──────────┴─────────┘');
console.log('⚠️ = projected time >25% off target');
console.log('');
console.log(`Target total:    ${(totalTarget / 60).toFixed(2)} h`);
console.log(`Projected total: ${(totalProj / 60).toFixed(2)} h`);
console.log(`Delta: ${((totalProj - totalTarget) / totalTarget * 100).toFixed(1)}% ${totalProj > totalTarget ? 'slower' : 'faster'} than target`);
console.log(`Flagged prestiges: ${flags}/${THRESHOLDS.length}`);
console.log('');
console.log('Run 1 target was 22 hours (per GDD §31 cycleTime-minutes budget).');
console.log('Current target sum at INTERIM thresholds:', (totalTarget / 60).toFixed(2), 'h.');
console.log('');
console.log('This is an envelope projection, not a sim. Sprint 8c TEST-5 remains');
console.log('the authoritative economy gate. If ≥5 prestiges flag here, the');
console.log('baseThresholdTable likely needs re-tuning BEFORE TEST-5 starts.');

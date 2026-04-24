# TEST-5 canonical economy simulation report

**Sprint 8c BLOCKING gate** per SPRINTS.md §Sprint 8c.
**Configs:** 27 (3 tap × 3 arch × 3 path) × 3 Runs each. **Cycle samples:** 2106.
**Elapsed:** 28.7s real time.

## Gate summary

- Sims completing all 3 Runs: **27/27**
- Sims timed out: **0**
- Total anomalies: **0**
- Cycles flagged >20% off §9 target: **2065** ✗ FAIL — tuning iteration required
- Archetype×pathway combos >30% from cycle mean (P10+): **769** ⚠ flagged
- TUTOR-2 P0 at tap=2 reaches threshold in 7-9 min: **✗ FAIL** (avg 2.9 min)

## Pacing flags (>20% off §9 target)

| Config | Run | Cycle | Sim min | Target min | Δ% |
|---|---|---|---|---|---|
| tap2_analitica_rapida | R0 | P1 | 2.6 | 8 | -68% |
| tap2_analitica_rapida | R0 | P3 | 2.5 | 8 | -69% |
| tap2_analitica_rapida | R0 | P4 | 2.6 | 9 | -71% |
| tap2_analitica_rapida | R0 | P5 | 2.9 | 10 | -71% |
| tap2_analitica_rapida | R0 | P6 | 2.5 | 11 | -77% |
| tap2_analitica_rapida | R0 | P7 | 2.2 | 12 | -82% |
| tap2_analitica_rapida | R0 | P8 | 2.0 | 13 | -85% |
| tap2_analitica_rapida | R0 | P9 | 2.0 | 14 | -86% |
| tap2_analitica_rapida | R0 | P10 | 1.6 | 15 | -90% |
| tap2_analitica_rapida | R0 | P11 | 0.9 | 16 | -94% |
| tap2_analitica_rapida | R0 | P12 | 0.9 | 17 | -95% |
| tap2_analitica_rapida | R0 | P13 | 0.6 | 18 | -97% |
| tap2_analitica_rapida | R0 | P14 | 0.5 | 19 | -97% |
| tap2_analitica_rapida | R0 | P15 | 0.3 | 20 | -99% |
| tap2_analitica_rapida | R0 | P16 | 0.4 | 21 | -98% |
| tap2_analitica_rapida | R0 | P17 | 0.3 | 22 | -99% |
| tap2_analitica_rapida | R0 | P18 | 0.5 | 22 | -98% |
| tap2_analitica_rapida | R0 | P19 | 0.6 | 24 | -98% |
| tap2_analitica_rapida | R0 | P20 | 0.8 | 25 | -97% |
| tap2_analitica_rapida | R0 | P21 | 0.8 | 27 | -97% |
| tap2_analitica_rapida | R0 | P22 | 0.8 | 28 | -97% |
| tap2_analitica_rapida | R0 | P23 | 0.9 | 30 | -97% |
| tap2_analitica_rapida | R0 | P24 | 4.2 | 32 | -87% |
| tap2_analitica_rapida | R0 | P25 | 1.1 | 33 | -97% |
| tap2_analitica_rapida | R0 | P26 | 0.6 | 35 | -98% |
| tap2_analitica_rapida | R1 | P2 | 2.7 | 7 | -62% |
| tap2_analitica_rapida | R1 | P3 | 3.1 | 8 | -62% |
| tap2_analitica_rapida | R1 | P4 | 1.9 | 9 | -79% |
| tap2_analitica_rapida | R1 | P5 | 2.5 | 10 | -75% |
| tap2_analitica_rapida | R1 | P6 | 2.1 | 11 | -81% |
| tap2_analitica_rapida | R1 | P7 | 2.5 | 12 | -79% |
| tap2_analitica_rapida | R1 | P8 | 1.7 | 13 | -87% |
| tap2_analitica_rapida | R1 | P9 | 1.4 | 14 | -90% |
| tap2_analitica_rapida | R1 | P10 | 0.5 | 15 | -96% |
| tap2_analitica_rapida | R1 | P11 | 0.3 | 16 | -98% |
| tap2_analitica_rapida | R1 | P12 | 0.7 | 17 | -96% |
| tap2_analitica_rapida | R1 | P13 | 0.3 | 18 | -98% |
| tap2_analitica_rapida | R1 | P14 | 0.7 | 19 | -96% |
| tap2_analitica_rapida | R1 | P15 | 0.7 | 20 | -96% |
| tap2_analitica_rapida | R1 | P16 | 0.4 | 21 | -98% |
| tap2_analitica_rapida | R1 | P17 | 0.5 | 22 | -98% |
| tap2_analitica_rapida | R1 | P18 | 0.7 | 22 | -97% |
| tap2_analitica_rapida | R1 | P19 | 0.8 | 24 | -97% |
| tap2_analitica_rapida | R1 | P20 | 0.9 | 25 | -96% |
| tap2_analitica_rapida | R1 | P21 | 0.9 | 27 | -97% |
| tap2_analitica_rapida | R1 | P22 | 1.0 | 28 | -96% |
| tap2_analitica_rapida | R1 | P23 | 1.2 | 30 | -96% |
| tap2_analitica_rapida | R1 | P24 | 8.9 | 32 | -72% |
| tap2_analitica_rapida | R1 | P25 | 1.7 | 33 | -95% |
| tap2_analitica_rapida | R1 | P26 | 1.4 | 35 | -96% |
| tap2_analitica_rapida | R2 | P1 | 9.9 | 8 | +24% |
| tap2_analitica_rapida | R2 | P2 | 3.3 | 7 | -53% |
| tap2_analitica_rapida | R2 | P3 | 2.4 | 8 | -69% |
| tap2_analitica_rapida | R2 | P4 | 2.1 | 9 | -76% |
| tap2_analitica_rapida | R2 | P5 | 1.9 | 10 | -81% |
| tap2_analitica_rapida | R2 | P6 | 1.8 | 11 | -84% |
| tap2_analitica_rapida | R2 | P7 | 1.3 | 12 | -89% |
| tap2_analitica_rapida | R2 | P8 | 1.2 | 13 | -91% |
| tap2_analitica_rapida | R2 | P9 | 0.4 | 14 | -97% |
| tap2_analitica_rapida | R2 | P10 | 0.6 | 15 | -96% |
| tap2_analitica_rapida | R2 | P11 | 0.7 | 16 | -96% |
| tap2_analitica_rapida | R2 | P12 | 0.7 | 17 | -96% |
| tap2_analitica_rapida | R2 | P13 | 0.7 | 18 | -96% |
| tap2_analitica_rapida | R2 | P14 | 0.6 | 19 | -97% |
| tap2_analitica_rapida | R2 | P15 | 0.7 | 20 | -97% |
| tap2_analitica_rapida | R2 | P16 | 0.7 | 21 | -97% |
| tap2_analitica_rapida | R2 | P17 | 0.8 | 22 | -97% |
| tap2_analitica_rapida | R2 | P18 | 0.8 | 22 | -96% |
| tap2_analitica_rapida | R2 | P19 | 0.9 | 24 | -96% |
| tap2_analitica_rapida | R2 | P20 | 1.0 | 25 | -96% |
| tap2_analitica_rapida | R2 | P21 | 1.1 | 27 | -96% |
| tap2_analitica_rapida | R2 | P22 | 1.2 | 28 | -96% |
| tap2_analitica_rapida | R2 | P23 | 1.4 | 30 | -95% |
| tap2_analitica_rapida | R2 | P24 | 15.9 | 32 | -50% |
| tap2_analitica_rapida | R2 | P25 | 2.0 | 33 | -94% |
| tap2_analitica_rapida | R2 | P26 | 1.6 | 35 | -95% |
| tap2_analitica_profunda | R0 | P1 | 2.6 | 8 | -68% |
| tap2_analitica_profunda | R0 | P3 | 2.5 | 8 | -69% |
| tap2_analitica_profunda | R0 | P4 | 2.6 | 9 | -71% |
| tap2_analitica_profunda | R0 | P5 | 2.9 | 10 | -71% |

… and 1985 more (see CSV).

## Archetype×pathway balance flags (>30% from cycle mean, P10+)

| Cycle | Config | Sim min | Mean min | Δ% |
|---|---|---|---|---|
| P10 | tap2_analitica_rapida | 1.6 | 0.7 | +127% |
| P10 | tap2_analitica_profunda | 1.1 | 0.7 | +65% |
| P10 | tap2_analitica_profunda | 0.4 | 0.7 | -43% |
| P10 | tap2_analitica_equilibrada | 1.6 | 0.7 | +130% |
| P10 | tap2_empatica_rapida | 1.4 | 0.7 | +105% |
| P10 | tap2_empatica_profunda | 1.4 | 0.7 | +106% |
| P10 | tap2_empatica_equilibrada | 1.5 | 0.7 | +117% |
| P10 | tap2_creativa_rapida | 1.8 | 0.7 | +157% |
| P10 | tap2_creativa_profunda | 1.3 | 0.7 | +85% |
| P10 | tap2_creativa_equilibrada | 1.8 | 0.7 | +160% |
| P10 | tap5_analitica_rapida | 1.1 | 0.7 | +64% |
| P10 | tap5_analitica_rapida | 0.4 | 0.7 | -47% |
| P10 | tap5_analitica_rapida | 0.4 | 0.7 | -35% |
| P10 | tap5_analitica_profunda | 1.1 | 0.7 | +64% |
| P10 | tap5_analitica_profunda | 0.3 | 0.7 | -59% |
| P10 | tap5_analitica_profunda | 0.4 | 0.7 | -38% |
| P10 | tap5_analitica_equilibrada | 1.1 | 0.7 | +66% |
| P10 | tap5_analitica_equilibrada | 0.4 | 0.7 | -43% |
| P10 | tap5_empatica_rapida | 1.0 | 0.7 | +43% |
| P10 | tap5_empatica_rapida | 0.4 | 0.7 | -36% |
| P10 | tap5_empatica_rapida | 0.4 | 0.7 | -46% |
| P10 | tap5_empatica_profunda | 1.0 | 0.7 | +43% |
| P10 | tap5_empatica_profunda | 0.4 | 0.7 | -39% |
| P10 | tap5_empatica_equilibrada | 1.0 | 0.7 | +52% |
| P10 | tap5_empatica_equilibrada | 0.5 | 0.7 | -30% |
| P10 | tap5_creativa_rapida | 1.2 | 0.7 | +71% |
| P10 | tap5_creativa_rapida | 0.4 | 0.7 | -42% |
| P10 | tap5_creativa_rapida | 0.3 | 0.7 | -50% |
| P10 | tap5_creativa_profunda | 0.3 | 0.7 | -55% |
| P10 | tap5_creativa_profunda | 0.4 | 0.7 | -44% |
| P10 | tap5_creativa_profunda | 0.5 | 0.7 | -32% |
| P10 | tap5_creativa_equilibrada | 1.2 | 0.7 | +74% |
| P10 | tap10_analitica_rapida | 0.3 | 0.7 | -54% |
| P10 | tap10_analitica_rapida | 0.4 | 0.7 | -45% |
| P10 | tap10_analitica_profunda | 0.3 | 0.7 | -56% |
| P10 | tap10_analitica_profunda | 0.4 | 0.7 | -45% |
| P10 | tap10_analitica_equilibrada | 0.3 | 0.7 | -52% |
| P10 | tap10_analitica_equilibrada | 0.4 | 0.7 | -42% |
| P10 | tap10_empatica_rapida | 0.3 | 0.7 | -51% |
| P10 | tap10_empatica_rapida | 0.4 | 0.7 | -40% |

import type { NeuronType } from '@/types';

export type UpgradeCategory = 'tap' | 'focus' | 'neuron' | 'discharge' | 'region' | 'consciousness' | 'meta' | 'lategame';
export type UpgradeCostType = 'thoughts' | 'memories';
export type UpgradeTier = 'P0' | 'P2' | 'P4' | 'P6' | 'P10';

export interface UpgradeRequirement {
  prestigeCount?: number;
  ownedNeuron?: { type: NeuronType; min: number };
  distinctNeuronTypes?: number;
  region?: string;
  consciousnessPct?: number;
  firstDischargeTriggered?: boolean;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  tier: UpgradeTier;
  cost: number;
  costType: UpgradeCostType;
  requires: UpgradeRequirement;
  effect: string;
}

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  // TAP (3)
  { id: 'potencial_sinaptico', name: 'Potencial Sináptico', description: 'Tap ×2', category: 'tap', tier: 'P0', cost: 80, costType: 'thoughts', requires: {}, effect: 'tapMult*2' },
  { id: 'mielina', name: 'Mielina', description: 'Tap ×3', category: 'tap', tier: 'P0', cost: 800, costType: 'thoughts', requires: {}, effect: 'tapMult*3' },
  { id: 'dopamina', name: 'Dopamina', description: 'Tap +1 por Básica owned', category: 'tap', tier: 'P0', cost: 3_000, costType: 'thoughts', requires: { ownedNeuron: { type: 'basica', min: 8 } }, effect: 'tapAdd:basicaOwned' },

  // FOCUS (1)
  { id: 'concentracion_profunda', name: 'Concentración Profunda', description: 'Focus fill rate ×2. Insight dura +5s.', category: 'focus', tier: 'P4', cost: 25_000, costType: 'thoughts', requires: { prestigeCount: 4 }, effect: 'focusRate*2;insight+5s' },

  // NEURON (8)
  { id: 'red_neuronal_densa', name: 'Red Neuronal Densa', description: 'Básicas ×2', category: 'neuron', tier: 'P0', cost: 500, costType: 'thoughts', requires: { ownedNeuron: { type: 'basica', min: 3 } }, effect: 'basica*2' },
  { id: 'receptores_ampa', name: 'Receptores AMPA', description: 'Básicas ×2 adicional', category: 'neuron', tier: 'P0', cost: 3_000, costType: 'thoughts', requires: { ownedNeuron: { type: 'basica', min: 10 } }, effect: 'basica*2' },
  { id: 'transduccion_sensorial', name: 'Transducción Sensorial', description: 'Sensoriales ×3', category: 'neuron', tier: 'P0', cost: 5_000, costType: 'thoughts', requires: { ownedNeuron: { type: 'sensorial', min: 1 } }, effect: 'sensorial*3' },
  { id: 'axones_proyeccion', name: 'Axones de Proyección', description: 'Piramidales ×3', category: 'neuron', tier: 'P0', cost: 25_000, costType: 'thoughts', requires: { ownedNeuron: { type: 'piramidal', min: 1 } }, effect: 'piramidal*3' },
  { id: 'sincronia_neural', name: 'Sincronía Neural', description: '+20% por tipo activo (max +80%)', category: 'neuron', tier: 'P0', cost: 40_000, costType: 'thoughts', requires: { distinctNeuronTypes: 3 }, effect: 'allTypesPct+20' },
  { id: 'ltp_potenciacion', name: 'LTP Potenciación Larga', description: 'Todas las neuronas ×1.5', category: 'neuron', tier: 'P2', cost: 200_000, costType: 'thoughts', requires: { prestigeCount: 2 }, effect: 'allNeurons*1.5' },
  { id: 'espejo_resonantes', name: 'Espejo Resonantes', description: 'Espejos ×4', category: 'neuron', tier: 'P2', cost: 150_000, costType: 'thoughts', requires: { prestigeCount: 2 }, effect: 'espejo*4' },
  { id: 'neurogenesis', name: 'Neurogénesis', description: '+25% producción de todas las neuronas', category: 'neuron', tier: 'P4', cost: 500_000, costType: 'thoughts', requires: { prestigeCount: 4 }, effect: 'allNeurons*1.25' },

  // DISCHARGE (5)
  { id: 'descarga_neural', name: 'Descarga Neural', description: 'Cargas acumulan 25% más rápido', category: 'discharge', tier: 'P0', cost: 10_000, costType: 'thoughts', requires: { firstDischargeTriggered: true }, effect: 'chargeRate*1.25' },
  { id: 'amplificador_disparo', name: 'Amplificador de Disparo', description: 'Disparo bonus ×2 (60s de prod.)', category: 'discharge', tier: 'P0', cost: 30_000, costType: 'thoughts', requires: {}, effect: 'dischargeBonus*2' },
  { id: 'red_alta_velocidad', name: 'Red de Alta Velocidad', description: 'Max cargas 3 → 5', category: 'discharge', tier: 'P2', cost: 80_000, costType: 'thoughts', requires: { prestigeCount: 2 }, effect: 'maxCharges=5' },
  { id: 'cascada_profunda', name: 'Cascada Profunda', description: 'Cascada (Focus+Disparo): ×3 → ×5', category: 'discharge', tier: 'P4', cost: 200_000, costType: 'thoughts', requires: { prestigeCount: 4 }, effect: 'cascadeMult=5' },
  { id: 'sincronizacion_total', name: 'Sincronización Total', description: 'Disparo llena Focus Bar +30% automáticamente', category: 'discharge', tier: 'P4', cost: 400_000, costType: 'thoughts', requires: { prestigeCount: 4 }, effect: 'dischargeFillsFocus+0.3' },

  // REGION (5)
  { id: 'consolidacion_memoria', name: 'Consolidación de Memoria', description: 'Hipocampo: Básicas ×3. Memorias +50%', category: 'region', tier: 'P0', cost: 2, costType: 'memories', requires: { region: 'hipocampo' }, effect: 'basica*3;memories+50%' },
  { id: 'funciones_ejecutivas', name: 'Funciones Ejecutivas', description: 'Upgrades de Pensamientos −20% costo', category: 'region', tier: 'P2', cost: 3, costType: 'memories', requires: { prestigeCount: 2, region: 'corteza' }, effect: 'thoughtUpgradeCost*0.8' },
  { id: 'regulacion_emocional', name: 'Regulación Emocional', description: 'Offline eficiencia ×2', category: 'region', tier: 'P0', cost: 5, costType: 'memories', requires: { region: 'limbico' }, effect: 'offlineEff*2' },
  { id: 'procesamiento_visual', name: 'Procesamiento Visual', description: 'Muestra el mejor upgrade disponible', category: 'region', tier: 'P0', cost: 8, costType: 'memories', requires: { region: 'cortexvisual' }, effect: 'showBestUpgradeHint' },
  { id: 'amplitud_banda', name: 'Amplitud de Banda', description: 'Todas las regiones +50%', category: 'region', tier: 'P2', cost: 15, costType: 'memories', requires: { prestigeCount: 2 }, effect: 'allRegions*1.5' },

  // CONSCIOUSNESS (4)
  { id: 'sueno_rem', name: 'Sueño REM', description: 'Offline cap 4h → 8h', category: 'consciousness', tier: 'P0', cost: 50_000, costType: 'thoughts', requires: {}, effect: 'offlineCap=8h' },
  { id: 'umbral_consciencia', name: 'Umbral de Consciencia', description: 'Barra sube ×1.3 más rápido', category: 'consciousness', tier: 'P0', cost: 100_000, costType: 'thoughts', requires: { consciousnessPct: 0.5 }, effect: 'consciousnessRate*1.3' },
  { id: 'ritmo_circadiano', name: 'Ritmo Circadiano', description: 'Offline ×1.5 eficiencia + carga auto al volver ≥ cap', category: 'consciousness', tier: 'P2', cost: 200_000, costType: 'thoughts', requires: { prestigeCount: 2 }, effect: 'offlineEff*1.5;autoChargeOnReturn' },
  { id: 'hiperconciencia', name: 'Hiperconciencia', description: 'Barra sube ×2 más rápido', category: 'consciousness', tier: 'P4', cost: 500_000, costType: 'thoughts', requires: { prestigeCount: 4 }, effect: 'consciousnessRate*2' },

  // META (3)
  { id: 'retroalimentacion_positiva', name: 'Retroalimentación Positiva', description: '×2 toda la producción', category: 'meta', tier: 'P6', cost: 1_000_000, costType: 'thoughts', requires: { prestigeCount: 6 }, effect: 'allProd*2' },
  { id: 'emergencia_cognitiva', name: 'Emergencia Cognitiva', description: '×1.5 por upgrades comprados este ciclo', category: 'meta', tier: 'P6', cost: 1_500_000, costType: 'thoughts', requires: { prestigeCount: 6 }, effect: 'allProd*1.5perUpgrade' },
  { id: 'singularidad', name: 'Singularidad', description: '×3 toda la producción', category: 'meta', tier: 'P6', cost: 2_000_000, costType: 'thoughts', requires: { prestigeCount: 6 }, effect: 'allProd*3' },

  // LATEGAME P10+ (6)
  { id: 'convergencia_sinaptica', name: 'Convergencia Sináptica', description: '+3% de ciclo por prestige (máx +75%). Resetea en prestige.', category: 'lategame', tier: 'P10', cost: 200_000, costType: 'thoughts', requires: { prestigeCount: 10 }, effect: 'cycleBonus+3perP_max75' },
  { id: 'consciencia_distribuida', name: 'Consciencia Distribuida', description: 'Offline cap 8h → 12h', category: 'lategame', tier: 'P10', cost: 150_000, costType: 'thoughts', requires: { prestigeCount: 10 }, effect: 'offlineCap=12h' },
  { id: 'potencial_latente', name: 'Potencial Latente', description: 'Cada Disparo: +1,000 × prestigeCount', category: 'lategame', tier: 'P10', cost: 300_000, costType: 'thoughts', requires: { prestigeCount: 10 }, effect: 'dischargeAdd:1000*P' },
  { id: 'resonancia_acumulada', name: 'Resonancia Acumulada', description: '+5% al primer Disparo post-offline por cada hora (max +100%)', category: 'lategame', tier: 'P10', cost: 350_000, costType: 'thoughts', requires: { prestigeCount: 10 }, effect: 'firstDischargePostOffline+5perH_max100' },
  { id: 'sintesis_cognitiva', name: 'Síntesis Cognitiva', description: 'Neuronas ×2 primeros 5 min de cada sesión', category: 'lategame', tier: 'P10', cost: 500_000, costType: 'thoughts', requires: { prestigeCount: 10 }, effect: 'allNeurons*2_first5min' },
  { id: 'focus_persistente', name: 'Focus Persistente', description: 'Focus Bar retiene 50% al hacer prestige', category: 'lategame', tier: 'P10', cost: 600_000, costType: 'thoughts', requires: { prestigeCount: 10 }, effect: 'focusKeep0.5OnPrestige' },
];

export const UPGRADE_BY_ID: Readonly<Record<string, UpgradeDefinition>> = UPGRADE_DEFINITIONS.reduce(
  (acc, u) => {
    acc[u.id] = u;
    return acc;
  },
  {} as Record<string, UpgradeDefinition>,
);

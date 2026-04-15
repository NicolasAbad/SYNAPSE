import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SYNAPSE_CONSTANTS } from '@/config/constants';
import { gameTick } from '@/engine/tick';
import { calculateNeuronCost, calculateConnectionMult } from '@/engine/formulas';
import { buildInitialState } from './initialState';
import { capacitorStorage } from './storage';
import type { GameState, NeuronType } from '@/types';

const STORAGE_KEY = 'synapse:gameState:v1';

interface GameActions {
  tick: (dtMs: number) => void;
  tap: () => void;
  buyNeuron: (type: NeuronType) => void;
  triggerDischarge: () => void;
  resetAll: () => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...buildInitialState(),

      tick: (dtMs) =>
        set((state) => {
          const patch = gameTick(state, dtMs);
          return { ...state, ...patch };
        }),

      tap: () =>
        set((state) => {
          const mult =
            state.prestigeCount >= SYNAPSE_CONSTANTS.patternsPerPrestige
              ? SYNAPSE_CONSTANTS.tapMultiplierPostFocus
              : SYNAPSE_CONSTANTS.tapMultiplier;
          const gain = Math.max(
            SYNAPSE_CONSTANTS.baseTapThoughts,
            state.baseProductionPerSecond * mult,
          );
          return {
            ...state,
            thoughts: state.thoughts + gain,
            cycleGenerated: state.cycleGenerated + gain,
            totalGenerated: state.totalGenerated + gain,
          };
        }),

      buyNeuron: (type) =>
        set((state) => {
          const idx = state.neurons.findIndex((n) => n.type === type);
          if (idx === -1) return state;
          const neuron = state.neurons[idx]!;
          const cost = calculateNeuronCost(neuron.baseCost, neuron.owned);
          if (state.thoughts < cost) return state;
          const updatedNeurons = state.neurons.map((n, i) =>
            i === idx ? { ...n, owned: n.owned + 1 } : n,
          );
          const newState: GameState = {
            ...state,
            thoughts: state.thoughts - cost,
            neurons: updatedNeurons,
            cycleNeuronsBought: state.cycleNeuronsBought + 1,
          };
          newState.connectionMult = calculateConnectionMult(newState);
          return newState;
        }),

      triggerDischarge: () =>
        set((state) => {
          if (state.dischargeCharges <= 0) return state;
          let bonus = state.baseProductionPerSecond * SYNAPSE_CONSTANTS.dischargeBaseBonus;
          let focusBar = state.focusBar;
          if (focusBar >= SYNAPSE_CONSTANTS.cascadeThreshold) {
            bonus *= SYNAPSE_CONSTANTS.cascadeMultiplier;
            focusBar = 0;
          }
          return {
            ...state,
            thoughts: state.thoughts + bonus,
            cycleGenerated: state.cycleGenerated + bonus,
            totalGenerated: state.totalGenerated + bonus,
            dischargeCharges: state.dischargeCharges - 1,
            dischargeLastTimestamp: Date.now(),
            focusBar,
            lifetimeDischarges: state.lifetimeDischarges + 1,
          };
        }),

      resetAll: () => set(() => ({ ...buildInitialState() })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => capacitorStorage),
      version: 1,
    },
  ),
);

// @vitest-environment jsdom
// Tests for src/ui/hud/ConnectionChip.tsx (Sprint 3 Phase 5, Decision B).

import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ConnectionChip } from '../../../src/ui/hud/ConnectionChip';
import { useGameStore, createDefaultState } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('ConnectionChip — Decision B visibility gate', () => {
  test('renders nothing when only 1 neuron type owned (default state: Básica only)', () => {
    useGameStore.setState(createDefaultState());
    const { container } = render(<ConnectionChip />);
    expect(container.querySelector('[data-testid="hud-connection-chip"]')).toBeNull();
  });

  test('renders when 2+ types owned', () => {
    useGameStore.setState({
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 1 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      connectionMult: 1.05,
    });
    const { getByTestId } = render(<ConnectionChip />);
    expect(getByTestId('hud-connection-chip').textContent).toContain('1.05');
  });

  test('formats connectionMult to 2 decimals', () => {
    useGameStore.setState({
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 1 },
        { type: 'sensorial', count: 1 },
        { type: 'piramidal', count: 1 },
        { type: 'espejo', count: 1 },
        { type: 'integradora', count: 1 },
      ],
      connectionMult: 1.5,
    });
    const { getByTestId } = render(<ConnectionChip />);
    expect(getByTestId('hud-connection-chip').textContent).toBe('×1.50 conns');
  });

  test('hides again if counts drop (e.g. after undo)', () => {
    useGameStore.setState({
      ...createDefaultState(),
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 1 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      connectionMult: 1.05,
    });
    const { getByTestId, queryByTestId, rerender } = render(<ConnectionChip />);
    expect(getByTestId('hud-connection-chip')).toBeTruthy();
    useGameStore.setState({
      neurons: [
        { type: 'basica', count: 10 },
        { type: 'sensorial', count: 0 },
        { type: 'piramidal', count: 0 },
        { type: 'espejo', count: 0 },
        { type: 'integradora', count: 0 },
      ],
      connectionMult: 1.0,
    });
    rerender(<ConnectionChip />);
    expect(queryByTestId('hud-connection-chip')).toBeNull();
  });
});

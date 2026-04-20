// @vitest-environment jsdom
// Sprint 2 Phase 6 — CYCLE-1/CYCLE-2 layout shell tests.
// Tests isolate the component via prop injection — not wired to App.tsx
// until Sprint 4c (per Phase 6 [D4]).

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { CycleSetupScreen } from '../../../src/ui/modals/CycleSetupScreen';
import { BREAKPOINTS } from '../../../src/ui/tokens';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  cleanup();
});

describe('CycleSetupScreen — tablet (≥600px) column layout', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  test('prestigeCount=0 → 0 columns (no slots rendered)', () => {
    const { getByTestId, queryByTestId } = render(<CycleSetupScreen prestigeCount={0} />);
    expect(getByTestId('cycle-setup-screen').dataset.columnCount).toBe('0');
    expect(queryByTestId('cycle-setup-slot-polarity')).toBeNull();
    expect(queryByTestId('cycle-setup-slot-mutation')).toBeNull();
    expect(queryByTestId('cycle-setup-slot-pathway')).toBeNull();
  });

  test('prestigeCount=3 → 1 column (Polarity only)', () => {
    const { getByTestId, queryByTestId } = render(<CycleSetupScreen prestigeCount={3} />);
    expect(getByTestId('cycle-setup-screen').dataset.columnCount).toBe('1');
    expect(getByTestId('cycle-setup-slot-polarity')).toBeTruthy();
    expect(queryByTestId('cycle-setup-slot-mutation')).toBeNull();
    expect(queryByTestId('cycle-setup-slot-pathway')).toBeNull();
  });

  test('prestigeCount=7 → 2 columns (Polarity + Mutation)', () => {
    const { getByTestId, queryByTestId } = render(<CycleSetupScreen prestigeCount={7} />);
    expect(getByTestId('cycle-setup-screen').dataset.columnCount).toBe('2');
    expect(getByTestId('cycle-setup-slot-polarity')).toBeTruthy();
    expect(getByTestId('cycle-setup-slot-mutation')).toBeTruthy();
    expect(queryByTestId('cycle-setup-slot-pathway')).toBeNull();
  });

  test('prestigeCount=10 → 3 columns (Polarity + Mutation + Pathway)', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    expect(getByTestId('cycle-setup-screen').dataset.columnCount).toBe('3');
    expect(getByTestId('cycle-setup-slot-polarity')).toBeTruthy();
    expect(getByTestId('cycle-setup-slot-mutation')).toBeTruthy();
    expect(getByTestId('cycle-setup-slot-pathway')).toBeTruthy();
  });

  test('uses columns layout (not stepper) on tablet width', () => {
    const { getByTestId, queryByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    expect(getByTestId('cycle-setup-screen').dataset.layout).toBe('columns');
    expect(getByTestId('cycle-setup-columns')).toBeTruthy();
    expect(queryByTestId('cycle-setup-stepper')).toBeNull();
  });
});

describe('CycleSetupScreen — phone (<600px) step-by-step layout', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  test('uses stepper layout (not columns)', () => {
    const { getByTestId, queryByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    expect(getByTestId('cycle-setup-screen').dataset.layout).toBe('stepper');
    expect(getByTestId('cycle-setup-stepper')).toBeTruthy();
    expect(queryByTestId('cycle-setup-columns')).toBeNull();
  });

  test('prestigeCount=10: renders Next button + 3 progress dots', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    expect(getByTestId('cycle-setup-progress-dots')).toBeTruthy();
    expect(getByTestId('cycle-setup-dot-0').dataset.active).toBe('true');
    expect(getByTestId('cycle-setup-dot-1').dataset.active).toBe('false');
    expect(getByTestId('cycle-setup-dot-2').dataset.active).toBe('false');
    expect(getByTestId('cycle-setup-next')).toBeTruthy();
  });

  test('Next advances the step index and shifts active dot', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    fireEvent.pointerDown(getByTestId('cycle-setup-next'));
    expect(getByTestId('cycle-setup-dot-0').dataset.active).toBe('false');
    expect(getByTestId('cycle-setup-dot-1').dataset.active).toBe('true');
  });

  test('prestigeCount=3 (1 slot): no progress dots, no Next button', () => {
    const { getByTestId, queryByTestId } = render(<CycleSetupScreen prestigeCount={3} />);
    expect(getByTestId('cycle-setup-slot-polarity')).toBeTruthy();
    expect(queryByTestId('cycle-setup-progress-dots')).toBeNull();
    expect(queryByTestId('cycle-setup-next')).toBeNull();
  });
});

describe('CycleSetupScreen — SAME AS LAST button', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  test('is present and disabled (no prior choices in Sprint 2)', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    const btn = getByTestId('cycle-setup-same-as-last') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('SAME AS LAST');
  });
});

describe('CycleSetupScreen — BREAKPOINTS token', () => {
  test('tablet breakpoint reads 600 from tokens.ts', () => {
    expect(BREAKPOINTS.tablet).toBe(600);
  });
});

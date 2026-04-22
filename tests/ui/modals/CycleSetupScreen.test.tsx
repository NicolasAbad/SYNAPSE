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

describe('CycleSetupScreen — SAME AS LAST button (Sprint 4c.3)', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  test('disabled when no lastCyclePolarity passed (default)', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={10} />);
    const btn = getByTestId('cycle-setup-same-as-last') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('enabled when lastCyclePolarity provided + polarity slot unlocked', () => {
    const { getByTestId } = render(
      <CycleSetupScreen prestigeCount={3} lastCyclePolarity="excitatory" onChoose={() => {}} />,
    );
    const btn = getByTestId('cycle-setup-same-as-last') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  test('disabled pre-P3 even with lastCyclePolarity', () => {
    const { getByTestId } = render(
      <CycleSetupScreen prestigeCount={0} lastCyclePolarity="excitatory" onChoose={() => {}} />,
    );
    const btn = getByTestId('cycle-setup-same-as-last') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test('onChoose fires with lastCyclePolarity when SAME AS LAST clicked', () => {
    const onChoose = vi.fn();
    const { getByTestId } = render(
      <CycleSetupScreen prestigeCount={3} lastCyclePolarity="inhibitory" onChoose={onChoose} />,
    );
    fireEvent.pointerDown(getByTestId('cycle-setup-same-as-last'));
    // Sprint 5 Phase 5.5: onChoose signature changed to CycleSetupChoice triple.
    expect(onChoose).toHaveBeenCalledWith({ polarity: 'inhibitory', mutationId: null, pathway: null });
  });
});

describe('CycleSetupScreen — Polarity slot interactive (Sprint 4c.3)', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  test('renders Excitatory + Inhibitory cards inside the polarity slot', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={3} onChoose={() => {}} />);
    expect(getByTestId('cycle-setup-polarity-excitatory')).toBeTruthy();
    expect(getByTestId('cycle-setup-polarity-inhibitory')).toBeTruthy();
  });

  test('clicking a polarity card selects it (data-selected=true)', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={3} onChoose={() => {}} />);
    const card = getByTestId('cycle-setup-polarity-excitatory');
    expect(card.dataset.selected).toBe('false');
    fireEvent.pointerDown(card);
    expect(card.dataset.selected).toBe('true');
  });

  test('POLAR-1 default: lastCyclePolarity pre-selects that card', () => {
    const { getByTestId } = render(
      <CycleSetupScreen prestigeCount={3} lastCyclePolarity="inhibitory" onChoose={() => {}} />,
    );
    expect(getByTestId('cycle-setup-polarity-inhibitory').dataset.selected).toBe('true');
    expect(getByTestId('cycle-setup-polarity-excitatory').dataset.selected).toBe('false');
  });

  test('switching selection: click Inhibitory after Excitatory is selected', () => {
    const { getByTestId } = render(
      <CycleSetupScreen prestigeCount={3} lastCyclePolarity="excitatory" onChoose={() => {}} />,
    );
    fireEvent.pointerDown(getByTestId('cycle-setup-polarity-inhibitory'));
    expect(getByTestId('cycle-setup-polarity-excitatory').dataset.selected).toBe('false');
    expect(getByTestId('cycle-setup-polarity-inhibitory').dataset.selected).toBe('true');
  });
});

describe('CycleSetupScreen — Continue button (Sprint 4c.3)', () => {
  beforeEach(() => {
    mockMatchMedia(true);
  });

  test('disabled when no polarity selected', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={3} onChoose={() => {}} />);
    expect((getByTestId('cycle-setup-continue') as HTMLButtonElement).disabled).toBe(true);
  });

  test('enabled once a polarity is selected', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={3} onChoose={() => {}} />);
    fireEvent.pointerDown(getByTestId('cycle-setup-polarity-excitatory'));
    expect((getByTestId('cycle-setup-continue') as HTMLButtonElement).disabled).toBe(false);
  });

  test('onChoose fires with selected polarity on Continue click', () => {
    const onChoose = vi.fn();
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={3} onChoose={onChoose} />);
    fireEvent.pointerDown(getByTestId('cycle-setup-polarity-inhibitory'));
    fireEvent.pointerDown(getByTestId('cycle-setup-continue'));
    // Sprint 5 Phase 5.5: onChoose signature changed to CycleSetupChoice triple.
    expect(onChoose).toHaveBeenCalledWith({ polarity: 'inhibitory', mutationId: null, pathway: null });
  });

  test('disabled pre-P3 (polarity slot locked)', () => {
    const { getByTestId } = render(<CycleSetupScreen prestigeCount={0} onChoose={() => {}} />);
    expect((getByTestId('cycle-setup-continue') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('CycleSetupScreen — BREAKPOINTS token', () => {
  test('tablet breakpoint reads 600 from tokens.ts', () => {
    expect(BREAKPOINTS.tablet).toBe(600);
  });
});

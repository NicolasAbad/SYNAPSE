// @vitest-environment jsdom
// Sprint 10 Phase 10.6 — TapFloaterLayer + tapFloaterEvents pub/sub.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { TapFloaterLayer } from '../../../src/ui/canvas/TapFloaterLayer';
import { publishTapFloater, __resetTapFloaterEventsForTests } from '../../../src/ui/canvas/tapFloaterEvents';

beforeEach(() => {
  __resetTapFloaterEventsForTests();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  __resetTapFloaterEventsForTests();
});

describe('TapFloaterLayer', () => {
  test('renders nothing initially', () => {
    const { queryByTestId } = render(<TapFloaterLayer />);
    expect(queryByTestId('tap-floater-layer')).toBeNull();
  });

  test('renders a floater when an event is published', () => {
    const { queryAllByTestId } = render(<TapFloaterLayer />);
    act(() => { publishTapFloater({ x: 100, y: 200, amount: 7 }); });
    const floaters = queryAllByTestId('tap-floater');
    expect(floaters.length).toBe(1);
    expect(floaters[0].textContent).toBe('+7');
  });

  test('removes floater after lifetime window', () => {
    const { queryAllByTestId } = render(<TapFloaterLayer />);
    act(() => { publishTapFloater({ x: 50, y: 60, amount: 3 }); });
    expect(queryAllByTestId('tap-floater').length).toBe(1);
    act(() => { vi.advanceTimersByTime(500); });
    expect(queryAllByTestId('tap-floater').length).toBe(0);
  });

  test('caps visible floaters at 12 (drops oldest under tap-spam)', () => {
    const { queryAllByTestId } = render(<TapFloaterLayer />);
    act(() => {
      for (let i = 0; i < 20; i++) publishTapFloater({ x: i, y: i, amount: i + 1 });
    });
    expect(queryAllByTestId('tap-floater').length).toBe(12);
  });

  test('positions floater via inline left/top px', () => {
    const { getByTestId } = render(<TapFloaterLayer />);
    act(() => { publishTapFloater({ x: 250, y: 400, amount: 2 }); });
    const floater = getByTestId('tap-floater') as HTMLElement;
    expect(floater.style.left).toBe('250px');
    expect(floater.style.top).toBe('400px');
  });
});

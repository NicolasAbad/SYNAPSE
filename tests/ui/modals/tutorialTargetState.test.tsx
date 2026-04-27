// @vitest-environment jsdom
// Pre-launch audit Dim M Phase 2 (M-7) — tutorial-target signal tests.
// Covers the pubsub/useSyncExternalStore plumbing in isolation. The
// HINT_TARGET mapping inside TutorialHints.tsx is verified via the
// existing TutorialHints test suite (pre-existing) once it picks up the
// new behavior.

import { describe, expect, test, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import {
  setActiveTutorialTarget,
  useIsTutorialTarget,
  _resetTutorialTarget,
} from '../../../src/ui/modals/tutorialTargetState';

beforeEach(() => {
  _resetTutorialTarget();
});

function Probe({ id }: { id: string }) {
  const isActive = useIsTutorialTarget(id);
  return <span data-testid={`probe-${id}`}>{isActive ? 'on' : 'off'}</span>;
}

describe('tutorialTargetState', () => {
  test('initial state: no target → all consumers read off', () => {
    const { getByTestId } = render(
      <>
        <Probe id="discharge-button" />
        <Probe id="tab-upgrades" />
      </>
    );
    expect(getByTestId('probe-discharge-button').textContent).toBe('off');
    expect(getByTestId('probe-tab-upgrades').textContent).toBe('off');
  });

  test('setActiveTutorialTarget("X") flips only the matching consumer to on', () => {
    const { getByTestId } = render(
      <>
        <Probe id="discharge-button" />
        <Probe id="tab-upgrades" />
      </>
    );
    act(() => { setActiveTutorialTarget('discharge-button'); });
    expect(getByTestId('probe-discharge-button').textContent).toBe('on');
    expect(getByTestId('probe-tab-upgrades').textContent).toBe('off');
  });

  test('switching the active target re-renders both old + new consumers', () => {
    const { getByTestId } = render(
      <>
        <Probe id="discharge-button" />
        <Probe id="tab-upgrades" />
      </>
    );
    act(() => { setActiveTutorialTarget('discharge-button'); });
    expect(getByTestId('probe-discharge-button').textContent).toBe('on');
    act(() => { setActiveTutorialTarget('tab-upgrades'); });
    expect(getByTestId('probe-discharge-button').textContent).toBe('off');
    expect(getByTestId('probe-tab-upgrades').textContent).toBe('on');
  });

  test('setActiveTutorialTarget(null) clears all consumers', () => {
    const { getByTestId } = render(<Probe id="discharge-button" />);
    act(() => { setActiveTutorialTarget('discharge-button'); });
    expect(getByTestId('probe-discharge-button').textContent).toBe('on');
    act(() => { setActiveTutorialTarget(null); });
    expect(getByTestId('probe-discharge-button').textContent).toBe('off');
  });

  test('idempotent — calling set with the same id twice does not crash', () => {
    const { getByTestId } = render(<Probe id="x" />);
    act(() => { setActiveTutorialTarget('x'); });
    act(() => { setActiveTutorialTarget('x'); });
    expect(getByTestId('probe-x').textContent).toBe('on');
  });
});

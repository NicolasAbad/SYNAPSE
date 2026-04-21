// @vitest-environment jsdom
// Tests for src/ui/modals/DecisionModal.tsx (Sprint 4b Phase 4b.5).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { DecisionModal } from '../../../src/ui/modals/DecisionModal';
import { PATTERN_DECISIONS } from '../../../src/config/patterns';

afterEach(() => cleanup());

describe('DecisionModal — visibility gate', () => {
  test('renders nothing when open=false', () => {
    const { queryByTestId } = render(
      <DecisionModal open={false} nodeIndex={6} definition={PATTERN_DECISIONS[6]} onChoose={() => {}} />,
    );
    expect(queryByTestId('decision-modal-6')).toBeNull();
  });

  test('renders when open=true', () => {
    const { getByTestId } = render(
      <DecisionModal open nodeIndex={6} definition={PATTERN_DECISIONS[6]} onChoose={() => {}} />,
    );
    expect(getByTestId('decision-modal-6')).toBeTruthy();
  });
});

describe('DecisionModal — content wiring', () => {
  test('renders Option A + Option B descriptions from the definition', () => {
    const { getByTestId } = render(
      <DecisionModal open nodeIndex={6} definition={PATTERN_DECISIONS[6]} onChoose={() => {}} />,
    );
    expect(getByTestId('decision-6-A').textContent).toContain(PATTERN_DECISIONS[6].A.description);
    expect(getByTestId('decision-6-B').textContent).toContain(PATTERN_DECISIONS[6].B.description);
  });

  test('testIds are scoped per node — modal for node 36 distinct from node 6', () => {
    const { getByTestId, queryByTestId } = render(
      <DecisionModal open nodeIndex={36} definition={PATTERN_DECISIONS[36]} onChoose={() => {}} />,
    );
    expect(getByTestId('decision-modal-36')).toBeTruthy();
    expect(getByTestId('decision-36-A')).toBeTruthy();
    expect(queryByTestId('decision-modal-6')).toBeNull();
  });
});

describe('DecisionModal — interaction', () => {
  test('onChoose fires with "A" when the A button is pressed', () => {
    const onChoose = vi.fn();
    const { getByTestId } = render(
      <DecisionModal open nodeIndex={6} definition={PATTERN_DECISIONS[6]} onChoose={onChoose} />,
    );
    fireEvent.pointerDown(getByTestId('decision-6-A'));
    expect(onChoose).toHaveBeenCalledWith('A');
  });

  test('onChoose fires with "B" when the B button is pressed', () => {
    const onChoose = vi.fn();
    const { getByTestId } = render(
      <DecisionModal open nodeIndex={15} definition={PATTERN_DECISIONS[15]} onChoose={onChoose} />,
    );
    fireEvent.pointerDown(getByTestId('decision-15-B'));
    expect(onChoose).toHaveBeenCalledWith('B');
  });
});

describe('DecisionModal — accessibility', () => {
  test('role="dialog" + aria-modal + aria-labelledby wiring', () => {
    const { getByTestId } = render(
      <DecisionModal open nodeIndex={6} definition={PATTERN_DECISIONS[6]} onChoose={() => {}} />,
    );
    const root = getByTestId('decision-modal-6');
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(root.getAttribute('aria-labelledby')).toBe('decision-6-title');
  });

  test('Option A is default-focused when opened', () => {
    const { getByTestId } = render(
      <DecisionModal open nodeIndex={6} definition={PATTERN_DECISIONS[6]} onChoose={() => {}} />,
    );
    expect(document.activeElement).toBe(getByTestId('decision-6-A'));
  });
});

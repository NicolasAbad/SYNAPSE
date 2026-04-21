// @vitest-environment jsdom
// Tests for src/ui/modals/ConfirmModal.tsx (Sprint 4a Phase 4a.5).
// Generic dialog reused by prestige + Sprint 8b Transcendence — these tests
// pin the behaviors the reuse depends on (focus on cancel, escape = cancel,
// onConfirm / onCancel firing, test-id scoping via prefix).

import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ConfirmModal } from '../../../src/ui/modals/ConfirmModal';

afterEach(() => cleanup());

describe('ConfirmModal — visibility gate', () => {
  test('renders nothing when open=false', () => {
    const { queryByTestId } = render(
      <ConfirmModal
        open={false}
        title="T"
        body="B"
        confirmLabel="OK"
        cancelLabel="Nope"
        onConfirm={() => {}}
        onCancel={() => {}}
        testIdPrefix="x"
      />,
    );
    expect(queryByTestId('x-root')).toBeNull();
  });

  test('renders when open=true', () => {
    const { getByTestId } = render(
      <ConfirmModal
        open
        title="T"
        body="B"
        confirmLabel="OK"
        cancelLabel="Nope"
        onConfirm={() => {}}
        onCancel={() => {}}
        testIdPrefix="x"
      />,
    );
    expect(getByTestId('x-root')).toBeTruthy();
  });
});

describe('ConfirmModal — content + test-id scoping', () => {
  test('renders title, body, and labels via testIdPrefix', () => {
    const { getByTestId } = render(
      <ConfirmModal
        open
        title="Awaken?"
        body="Reset cycle"
        confirmLabel="Awaken"
        cancelLabel="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
        testIdPrefix="prestige"
      />,
    );
    expect(getByTestId('prestige-title').textContent).toBe('Awaken?');
    expect(getByTestId('prestige-body').textContent).toBe('Reset cycle');
    expect(getByTestId('prestige-cancel').textContent).toBe('Cancel');
    expect(getByTestId('prestige-confirm').textContent).toBe('Awaken');
  });

  test('two modals with different prefixes render independently', () => {
    const { getByTestId } = render(
      <div>
        <ConfirmModal
          open
          title="A"
          body=""
          confirmLabel=""
          cancelLabel=""
          onConfirm={() => {}}
          onCancel={() => {}}
          testIdPrefix="prestige"
        />
        <ConfirmModal
          open
          title="B"
          body=""
          confirmLabel=""
          cancelLabel=""
          onConfirm={() => {}}
          onCancel={() => {}}
          testIdPrefix="transcendence"
        />
      </div>,
    );
    expect(getByTestId('prestige-title').textContent).toBe('A');
    expect(getByTestId('transcendence-title').textContent).toBe('B');
  });
});

describe('ConfirmModal — interaction', () => {
  test('onCancel fires when cancel button is pressed', () => {
    const onCancel = vi.fn();
    const { getByTestId } = render(
      <ConfirmModal
        open
        title=""
        body=""
        confirmLabel=""
        cancelLabel=""
        onConfirm={() => {}}
        onCancel={onCancel}
        testIdPrefix="x"
      />,
    );
    fireEvent.pointerDown(getByTestId('x-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('onConfirm fires when confirm button is pressed', () => {
    const onConfirm = vi.fn();
    const { getByTestId } = render(
      <ConfirmModal
        open
        title=""
        body=""
        confirmLabel=""
        cancelLabel=""
        onConfirm={onConfirm}
        onCancel={() => {}}
        testIdPrefix="x"
      />,
    );
    fireEvent.pointerDown(getByTestId('x-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('Escape key triggers onCancel (accessibility default)', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open
        title=""
        body=""
        confirmLabel=""
        cancelLabel=""
        onConfirm={() => {}}
        onCancel={onCancel}
        testIdPrefix="x"
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ConfirmModal — accessibility', () => {
  test('role="dialog" + aria-modal + aria-labelledby wiring', () => {
    const { getByTestId } = render(
      <ConfirmModal
        open
        title="T"
        body=""
        confirmLabel=""
        cancelLabel=""
        onConfirm={() => {}}
        onCancel={() => {}}
        testIdPrefix="x"
      />,
    );
    const root = getByTestId('x-root');
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(root.getAttribute('aria-labelledby')).toBe('x-title');
    expect(getByTestId('x-title').id).toBe('x-title');
  });

  test('Cancel button is default-focused when opened', async () => {
    const { getByTestId } = render(
      <ConfirmModal
        open
        title=""
        body=""
        confirmLabel=""
        cancelLabel=""
        onConfirm={() => {}}
        onCancel={() => {}}
        testIdPrefix="x"
      />,
    );
    expect(document.activeElement).toBe(getByTestId('x-cancel'));
  });
});

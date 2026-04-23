// @vitest-environment jsdom
// Sprint 7.7 Phase 7.7.5 — Mind → Mastery sub-tab UI (GDD §38.3).

import { afterEach, describe, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MasterySubtab } from '../../../src/ui/panels/MasterySubtab';
import { useGameStore } from '../../../src/store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.getState().reset();
});

describe('MasterySubtab — section tabs', () => {
  test('renders the 4 section tabs (Mutations / Upgrades / Pathways / Archetypes)', () => {
    const { getByTestId } = render(<MasterySubtab />);
    expect(getByTestId('mastery-section-mutation')).not.toBeNull();
    expect(getByTestId('mastery-section-upgrade')).not.toBeNull();
    expect(getByTestId('mastery-section-pathway')).not.toBeNull();
    expect(getByTestId('mastery-section-archetype')).not.toBeNull();
  });

  test('default active section is Mutations', () => {
    const { getByTestId } = render(<MasterySubtab />);
    expect(getByTestId('mastery-section-mutation').getAttribute('data-active')).toBe('true');
    expect(getByTestId('mastery-section-archetype').getAttribute('data-active')).toBe('false');
  });

  test('clicking a section tab switches the active grid', () => {
    const { getByTestId } = render(<MasterySubtab />);
    expect(getByTestId('mastery-grid-mutation')).not.toBeNull();
    act(() => {
      fireEvent.pointerDown(getByTestId('mastery-section-archetype'));
    });
    expect(getByTestId('mastery-grid-archetype')).not.toBeNull();
    expect(getByTestId('mastery-section-archetype').getAttribute('data-active')).toBe('true');
  });
});

describe('MasterySubtab — entity cards', () => {
  test('locked (0 uses) cards show ??? and the "Use once to reveal" hint', () => {
    const { getByTestId } = render(<MasterySubtab />);
    const card = getByTestId('mastery-card-hiperestimulacion');
    expect(card.getAttribute('data-revealed')).toBe('false');
    expect(card.textContent).toContain('???');
    expect(card.textContent).toContain('Use once to reveal');
  });

  test('revealed card (uses > 0) shows id + level + uses count', () => {
    useGameStore.setState({ mastery: { hiperestimulacion: 3.5 } });
    const { getByTestId } = render(<MasterySubtab />);
    const card = getByTestId('mastery-card-hiperestimulacion');
    expect(card.getAttribute('data-revealed')).toBe('true');
    expect(card.textContent).toContain('hiperestimulacion');
    expect(card.textContent).toContain('Level 3');
    expect(card.textContent).toContain('3 uses');
  });

  test('L10 cards append the MAX suffix', () => {
    useGameStore.setState({ mastery: { rapida: 10 } });
    const { getByTestId } = render(<MasterySubtab />);
    act(() => {
      fireEvent.pointerDown(getByTestId('mastery-section-pathway'));
    });
    const card = getByTestId('mastery-card-rapida');
    expect(card.textContent).toContain('Level 10');
    expect(card.textContent).toContain('MAX');
  });

  test('archetype section renders 3 cards (one per archetype)', () => {
    const { getByTestId } = render(<MasterySubtab />);
    act(() => {
      fireEvent.pointerDown(getByTestId('mastery-section-archetype'));
    });
    expect(getByTestId('mastery-card-analitica')).not.toBeNull();
    expect(getByTestId('mastery-card-empatica')).not.toBeNull();
    expect(getByTestId('mastery-card-creativa')).not.toBeNull();
  });
});

import { describe, test, expect } from 'vitest';
import { t } from '../../src/config/strings';
import { UPGRADES } from '../../src/config/upgrades';

describe('i18n t() function — en.ts contract', () => {
  test('hud.thoughts_label returns "thoughts"', () => {
    expect(t('hud.thoughts_label')).toBe('thoughts');
  });

  test('all 4 tabs return non-empty distinct strings', () => {
    const mind = t('tabs.mind');
    const neurons = t('tabs.neurons');
    const upgrades = t('tabs.upgrades');
    const regions = t('tabs.regions');
    expect(mind).toBe('Mind');
    expect(neurons).toBe('Neurons');
    expect(upgrades).toBe('Upgrades');
    expect(regions).toBe('Regions');
    expect(new Set([mind, neurons, upgrades, regions]).size).toBe(4);
  });

  test('all 5 neurons have name + description', () => {
    const types = ['basica', 'sensorial', 'piramidal', 'espejo', 'integradora'];
    for (const type of types) {
      const name = t(`neurons.${type}.name`);
      const desc = t(`neurons.${type}.description`);
      expect(name.length).toBeGreaterThan(0);
      expect(desc.length).toBeGreaterThan(0);
      expect(name).not.toBe(`neurons.${type}.name`);
    }
  });

  test('neuron display names match neuroscience decision', () => {
    expect(t('neurons.basica.name')).toBe('Basic');
    expect(t('neurons.sensorial.name')).toBe('Sensory');
    expect(t('neurons.piramidal.name')).toBe('Pyramidal');
    expect(t('neurons.espejo.name')).toBe('Mirror');
    expect(t('neurons.integradora.name')).toBe('Interneuron');
  });

  test('discharge button strings exist', () => {
    expect(t('buttons.discharge')).toBe('DISCHARGE ⚡');
    expect(t('buttons.discharge_locked_tooltip')).toBe('Unlocks in next update');
  });

  test('missing key returns key as fallback (debug marker)', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
    expect(t('hud.this_does_not_exist')).toBe('hud.this_does_not_exist');
  });

  test('t() never throws on malformed key', () => {
    expect(() => t('')).not.toThrow();
    expect(() => t('..')).not.toThrow();
    expect(() => t('deeply.nested.nonexistent.path.many.levels')).not.toThrow();
  });

  test('every UPGRADE id resolves to a non-empty display name via t()', () => {
    // CODE-1 invariant: adding an upgrade without its string would break
    // the UI silently. This test binds UPGRADES ↔ en.ts.
    for (const u of UPGRADES) {
      const key = `upgrades.${u.id}`;
      const name = t(key);
      expect(name).not.toBe(key);
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

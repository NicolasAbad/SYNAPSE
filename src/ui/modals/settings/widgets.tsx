// Sprint 10 Phase 10.1 — SettingsModal row primitives (components only).
// Style tokens live in `./styles` so react-refresh HMR stays happy.

import { type ReactNode } from 'react';
import { SYNAPSE_CONSTANTS } from '../../../config/constants';
import { rowStyle, sectionHeaderStyle, labelStyle, captionStyle } from './styles';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 style={sectionHeaderStyle}>{title}</h3>
      {children}
    </div>
  );
}

export function ToggleRow({ label, hint, checked, onChange, testId }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <div style={rowStyle}>
      <div>
        <div style={labelStyle}>{label}</div>
        {hint && <div style={captionStyle}>{hint}</div>}
      </div>
      <input type="checkbox" data-testid={testId} checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
    </div>
  );
}

export function SliderRow({ label, value, onChange, testId }: { label: string; value: number; onChange: (v: number) => void; testId: string }) {
  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <input
        type="range"
        data-testid={testId}
        min={0}
        max={100} // CONST-OK CSS slider bounds match V-1 0-100% UX
        step={SYNAPSE_CONSTANTS.sfxVolumeStepPct}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={`${value}%`}
      />
    </div>
  );
}

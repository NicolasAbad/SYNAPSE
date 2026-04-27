// Sprint 9a Phase 9a.2 — Settings modal entry point.
// Sprint 10 Phase 10.1 expanded into 6 sections per V-6:
//   General | Audio | Accessibility | Notifications | Account | Game.
// Volume sliders 0–100 in 5% steps (V-1), apply on slide (V-2).
// Accessibility + Notifications consumers ship in 10.4/10.5 (V-5/V-7).
//
// Adapter injection: parent (App.tsx) creates a RevenueCatAdapter on native and
// passes its `restorePurchases` method as a prop. In web preview / tests, prop
// is undefined → button disabled with a "native only" hint.

import { memo, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { en } from '../../config/strings/en';
import type { CustomerInfo } from '../../platform/revenuecat';
import type { FontSize, Language } from '../../types';
import { HardResetFlow } from './HardResetFlow';
import {
  buttonStyle, captionStyle, cardStyle, disabledButtonStyle, labelStyle,
  overlayStyle, rowStyle, secondaryButtonStyle, statusLineStyle, titleStyle,
} from './settings/styles';
import { Section, SliderRow, ToggleRow } from './settings/widgets';
import { LEGAL_URLS } from '../../config/legalUrls';
import { LegalLinkButton } from './settings/LegalLinkButton';

const t = en.settings;

type RestoreFn = () => Promise<CustomerInfo>;
type RestoreStatus = 'idle' | 'pending' | 'success' | 'none-found' | 'failed';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** When undefined, Restore Purchases is disabled (web/test preview). */
  restorePurchases?: RestoreFn;
  /** Sprint 9b Phase 9b.2 — opens the Cosmetics Store modal. */
  onOpenCosmetics?: () => void;
}

function statusLabel(status: RestoreStatus): string {
  if (status === 'pending') return t.restorePending;
  if (status === 'success') return t.restoreSuccess;
  if (status === 'none-found') return t.restoreNoneFound;
  if (status === 'failed') return t.restoreFailed;
  return '';
}

export const SettingsModal = memo(function SettingsModal({ open, onClose, restorePurchases, onOpenCosmetics }: SettingsModalProps) {
  const setSubscriptionStatus = useGameStore((s) => s.setSubscriptionStatus);
  const geniusPassDismissals = useGameStore((s) => s.geniusPassDismissals);
  const resetGeniusPassDismissals = useGameStore((s) => s.resetGeniusPassDismissals);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const language = useGameStore((s) => s.language);
  const colorblindMode = useGameStore((s) => s.colorblindMode);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const highContrast = useGameStore((s) => s.highContrast);
  const fontSize = useGameStore((s) => s.fontSize);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);

  const setSfxVolume = useGameStore((s) => s.setSfxVolume);
  const setMusicVolume = useGameStore((s) => s.setMusicVolume);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const setColorblindMode = useGameStore((s) => s.setColorblindMode);
  const setReducedMotion = useGameStore((s) => s.setReducedMotion);
  const setHighContrast = useGameStore((s) => s.setHighContrast);
  const setFontSize = useGameStore((s) => s.setFontSize);
  const setNotificationsEnabled = useGameStore((s) => s.setNotificationsEnabled);
  // Pre-launch audit G-3 — GDPR Article 21 right-to-object: post-onboarding
  // analytics consent toggle. Players can opt out at GdprModal install-time;
  // this lets them change their mind from Settings any time after.
  const analyticsConsent = useGameStore((s) => s.analyticsConsent);
  const setAnalyticsConsent = useGameStore((s) => s.setAnalyticsConsent);

  const [status, setStatus] = useState<RestoreStatus>('idle');

  useEffect(() => { if (open) setStatus('idle'); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onRestoreClick = useCallback(async () => {
    if (!restorePurchases) return;
    setStatus('pending');
    try {
      const info = await restorePurchases();
      const hasPass = info.activeEntitlements.includes('genius_pass');
      setSubscriptionStatus(hasPass);
      setStatus(hasPass ? 'success' : 'none-found');
    } catch {
      setStatus('failed');
    }
  }, [restorePurchases, setSubscriptionStatus]);

  if (!open) return null;
  const restoreDisabled = restorePurchases === undefined || status === 'pending';

  return (
    <div data-testid="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" style={overlayStyle}>
      <div style={cardStyle}>
        <h2 id="settings-title" data-testid="settings-title" style={titleStyle}>{t.title}</h2>

        <Section title={t.sectionGeneral}>
          <div style={rowStyle}>
            <div style={labelStyle}>{t.languageLabel}</div>
            <select data-testid="settings-language" value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-label={t.languageLabel}>
              <option value="en">{t.languageEn}</option>
              <option value="es">{t.languageEs}</option>
            </select>
          </div>
        </Section>

        <Section title={t.sectionAudio}>
          <SliderRow label={t.sfxVolumeLabel} value={sfxVolume} onChange={setSfxVolume} testId="settings-sfx-volume" />
          <SliderRow label={t.musicVolumeLabel} value={musicVolume} onChange={setMusicVolume} testId="settings-music-volume" />
        </Section>

        <Section title={t.sectionAccessibility}>
          <ToggleRow label={t.colorblindLabel} hint={t.colorblindHint} checked={colorblindMode} onChange={setColorblindMode} testId="settings-colorblind" />
          <ToggleRow label={t.reducedMotionLabel} hint={t.reducedMotionHint} checked={reducedMotion} onChange={setReducedMotion} testId="settings-reduced-motion" />
          <ToggleRow label={t.highContrastLabel} hint={t.highContrastHint} checked={highContrast} onChange={setHighContrast} testId="settings-high-contrast" />
          <div style={rowStyle}>
            <div style={labelStyle}>{t.fontSizeLabel}</div>
            <select data-testid="settings-font-size" value={fontSize} onChange={(e) => setFontSize(e.target.value as FontSize)} aria-label={t.fontSizeLabel}>
              <option value="small">{t.fontSizeSmall}</option>
              <option value="medium">{t.fontSizeMedium}</option>
              <option value="large">{t.fontSizeLarge}</option>
            </select>
          </div>
        </Section>

        <Section title={t.sectionNotifications}>
          <ToggleRow label={t.notificationsLabel} hint={t.notificationsHint} checked={notificationsEnabled} onChange={setNotificationsEnabled} testId="settings-notifications" />
        </Section>

        <Section title={t.sectionPrivacy}>
          <ToggleRow label={t.analyticsConsentLabel} hint={t.analyticsConsentHint} checked={analyticsConsent} onChange={setAnalyticsConsent} testId="settings-analytics-consent" />
        </Section>

        <p style={captionStyle}>{t.deferredCaveat}</p>

        <Section title={t.sectionAccount}>
          <button type="button" data-testid="settings-restore" disabled={restoreDisabled} onClick={restoreDisabled ? undefined : onRestoreClick} style={restoreDisabled ? disabledButtonStyle : buttonStyle}>
            {t.restoreButton}
          </button>
          <p data-testid="settings-restore-status" style={statusLineStyle}>{statusLabel(status)}</p>
          {onOpenCosmetics && (
            <button type="button" data-testid="settings-cosmetics" onClick={onOpenCosmetics} style={buttonStyle}>{t.cosmeticsButton}</button>
          )}
        </Section>

        <Section title={t.sectionSubscription}>
          <ToggleRow
            label={t.geniusPassReEnableLabel}
            hint={t.geniusPassReEnableHint}
            checked={geniusPassDismissals === 0}
            onChange={(enabled) => { if (enabled) resetGeniusPassDismissals(); }}
            testId="settings-genius-pass-reenable"
          />
        </Section>

        <Section title={t.sectionGame}>
          <HardResetFlow />
        </Section>

        <Section title={t.sectionLegal}>
          <LegalLinkButton
            label={t.legalPrivacyButton}
            url={LEGAL_URLS.privacyPolicy}
            testId="settings-legal-privacy"
            missingLabel={t.legalUrlMissing}
          />
          <LegalLinkButton
            label={t.legalTermsButton}
            url={LEGAL_URLS.termsOfService}
            testId="settings-legal-terms"
            missingLabel={t.legalUrlMissing}
          />
          <LegalLinkButton
            label={t.legalEulaButton}
            url={LEGAL_URLS.geniusPassEula}
            testId="settings-legal-eula"
            missingLabel={t.legalUrlMissing}
          />
        </Section>

        <button type="button" data-testid="settings-close" onClick={onClose} style={secondaryButtonStyle}>{t.closeButton}</button>
      </div>
    </div>
  );
});

// Pre-launch audit Day 1 — legal URL configuration.
//
// PLACEHOLDER VALUES — Nico must replace these before App Store / Play Store
// submission. Both stores require these URLs in submission metadata fields.
// In-app links are also reviewer-checked under App Review 5.1.1 (data
// collection transparency) and Play Store Personal/Sensitive User Data policy.
//
// When the values are still empty strings, the Legal section in SettingsModal
// renders the buttons disabled with a "Link not yet configured" hint. This
// ensures the UI ships safely and tests can verify the disabled-state path.
//
// Recommended providers if you don't already have these documents:
//   - Privacy Policy: https://www.termsfeed.com/privacy-policy-generator/
//   - Terms of Service: https://www.termsfeed.com/terms-conditions-generator/
//   - Genius Pass EULA: extends standard subscription EULA template
//
// Once you have them, paste the URLs below and the buttons go live.
// These are configuration, not game numbers (CODE-1 does not apply).

export const LEGAL_URLS = {
  privacyPolicy: '',  // TODO Nico: paste Privacy Policy URL here
  termsOfService: '', // TODO Nico: paste Terms of Service URL here
  geniusPassEula: '', // TODO Nico: paste Genius Pass EULA URL here
} as const;

export function isLegalUrlConfigured(url: string): boolean {
  return url.trim().length > 0;
}

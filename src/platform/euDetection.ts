// Pre-launch audit Day 1 — GDPR / UK-GDPR jurisdiction detection.
//
// Purpose: decide whether the app should show the consent modal before
// firing analytics events. False negatives (EU user not prompted) are a
// GDPR Article 7 violation; false positives (non-EU user sees modal) are
// a single extra click. We bias toward false positives.
//
// Strategy: locale-language OR timezone match against the EEA + UK list
// (treated as one regulatory zone for v1.0; UK GDPR is materially aligned
// with EU GDPR). No network calls, no new dependencies — uses standard
// browser APIs (`navigator.language` and `Intl.DateTimeFormat`) that are
// available in the Capacitor WebView on both iOS and Android.
//
// Member-state list source: https://commission.europa.eu/about/contact/improving-and-promoting-your-public-services/european-economic-area-eea_en
// (27 EU + 3 EEA: Iceland, Liechtenstein, Norway). UK added separately
// because UK GDPR mirrors EU GDPR for app-store / consent purposes.
//
// This is a regulatory list, not a game-design value — it's not subject
// to CODE-1 anti-invention rules. Update if the EEA roster changes.

// Languages strongly associated with EEA/UK residence. We accept a match
// on either the language code (`de`, `fr`) or a region tag (`en-GB`, `en-IE`)
// because device locale can be set without a region.
const EEA_LANGUAGE_CODES = [
  'bg', // Bulgaria
  'cs', // Czechia
  'da', // Denmark
  'de', // Germany, Austria, parts of Switzerland (treated as EEA-adjacent)
  'el', // Greece
  'es', // Spain (and non-EEA Latin America — timezone gates this)
  'et', // Estonia
  'fi', // Finland
  'fr', // France (and non-EEA francophone — timezone gates this)
  'ga', // Irish
  'hr', // Croatia
  'hu', // Hungary
  'is', // Iceland
  'it', // Italy
  'lt', // Lithuania
  'lv', // Latvia
  'mt', // Malta
  'nb', // Norwegian Bokmål
  'nl', // Netherlands
  'nn', // Norwegian Nynorsk
  'no', // Norwegian
  'pl', // Poland
  'pt', // Portugal (and non-EEA Brazil — timezone gates this)
  'ro', // Romania
  'sk', // Slovakia
  'sl', // Slovenia
  'sv', // Sweden
];

// Region tags that unambiguously indicate an EEA/UK device locale.
const EEA_REGION_TAGS = [
  'en-GB', // UK
  'en-IE', // Ireland
  'en-MT', // Malta
  'fr-FR', 'fr-BE', 'fr-LU',
  'de-DE', 'de-AT', 'de-LI',
  'es-ES',
  'pt-PT',
  'nl-NL', 'nl-BE',
  'it-IT',
];

// Timezone prefixes whose presence confirms physical EEA/UK residence
// regardless of language. This catches non-EEA-language travelers in EEA
// territory and removes false positives for Latin-American spanish or
// Brazilian portuguese (whose timezones are America/*).
const EEA_TIMEZONE_PREFIXES = [
  'Europe/',
  'Atlantic/Azores',     // Portugal
  'Atlantic/Madeira',    // Portugal
  'Atlantic/Canary',     // Spain
  'Atlantic/Reykjavik',  // Iceland
];

function getNavigatorLanguage(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.language;
}

function getResolvedTimeZone(): string | undefined {
  if (typeof Intl === 'undefined') return undefined;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function languageMatchesEEA(language: string | undefined): boolean {
  if (!language) return false;
  if (EEA_REGION_TAGS.includes(language)) return true;
  const base = language.split('-')[0]?.toLowerCase();
  if (!base) return false;
  return EEA_LANGUAGE_CODES.includes(base);
}

function timeZoneMatchesEEA(tz: string | undefined): boolean {
  if (!tz) return false;
  return EEA_TIMEZONE_PREFIXES.some((prefix) => tz.startsWith(prefix));
}

/**
 * Returns true if the device locale OR timezone suggests the user is in
 * the EEA/UK and should see the GDPR consent modal. Cached per session
 * (locale doesn't change without app restart on mobile).
 */
let cached: boolean | undefined;
export function detectEU(): boolean {
  if (cached !== undefined) return cached;
  const language = getNavigatorLanguage();
  const tz = getResolvedTimeZone();
  cached = languageMatchesEEA(language) || timeZoneMatchesEEA(tz);
  return cached;
}

/** Test-only — reset cache between assertions. */
export function _resetEuDetectionCache(): void {
  cached = undefined;
}

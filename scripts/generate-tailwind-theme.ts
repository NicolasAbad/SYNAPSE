/**
 * Generates styles/_theme.generated.css from src/ui/tokens.ts
 * for Tailwind v4's @theme directive.
 *
 * Run via: npm run build:tokens (auto-runs before dev + build).
 * Output: generated file — do NOT edit manually, do NOT commit.
 */

import { COLORS, SPACING, RADII, TYPOGRAPHY } from '../src/ui/tokens';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const header = `/* AUTO-GENERATED from src/ui/tokens.ts — do not edit. */
/* Regenerate via: npm run build:tokens */

@theme {
`;

const footer = `}
`;

const lines: string[] = [];

// ── Colors ──
for (const [name, value] of Object.entries(COLORS)) {
  // camelCase → kebab-case, prefix --color-
  const kebab = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  lines.push(`  --color-${kebab}: ${value};`);
}

// ── Spacing ──
for (const [name, value] of Object.entries(SPACING)) {
  lines.push(`  --spacing-${name}: ${value};`);
}

// ── Radii ──
for (const [name, value] of Object.entries(RADII)) {
  const normalized = name.replace(/'/g, '');
  lines.push(`  --radius-${normalized}: ${value};`);
}

// ── Fonts ──
lines.push(`  --font-display: ${TYPOGRAPHY.fontDisplay};`);
lines.push(`  --font-body: ${TYPOGRAPHY.fontBody};`);
lines.push(`  --font-mono: ${TYPOGRAPHY.fontMono};`);

// ── Font sizes ──
for (const [name, value] of Object.entries(TYPOGRAPHY.size)) {
  const normalized = name.replace(/'/g, '');
  lines.push(`  --text-${normalized}: ${value};`);
}

// ── Font weights ──
for (const [name, value] of Object.entries(TYPOGRAPHY.weight)) {
  lines.push(`  --font-weight-${name}: ${value};`);
}

const output = header + lines.join('\n') + '\n' + footer;

const outPath = resolve(__dirname, '../styles/_theme.generated.css');
writeFileSync(outPath, output, 'utf-8');

console.log(`✓ Generated ${outPath} (${lines.length} tokens)`);

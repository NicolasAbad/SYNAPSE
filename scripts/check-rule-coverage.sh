#!/bin/bash
# Sprint 11a Phase 11a.5 — rule-coverage audit per SPRINTS.md §Sprint 11a line 1017 + 1042.
#
# Extracts every GDD rule ID (TRANS-1, MENTAL-5, PAT-3, etc.) and confirms
# each appears in at least one src/ file, test file, or sprint planning doc.
#
# Excluded prefixes: incident references (BUG-, EXPLOIT-, INTER-, UX-),
# spec-gap markers (GAP-), future-feature markers (WKLY- = Weekly Challenge
# not yet implemented), and INT- (interaction notes that live as GDD
# documentation only). The exclusion list is conservative — any new
# enforceable rule MUST appear in code/tests, not be allowlisted away.
#
# Known-uncovered allowlist: rules that exist as design documentation but
# have no rule-ID-tagged code reference. Most are implemented as named
# constants/functions/components without the rule ID in comments. Adding
# new entries here requires a one-line rationale.
#
# Usage: bash scripts/check-rule-coverage.sh
# Exit 0: all enforceable rules are covered
# Exit 1: a new unreferenced rule appeared

set -e
cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Prefixes that mark IDs as documentation-only (not enforceable rules).
EXCLUDED_PREFIXES="BUG- EXPLOIT- INTER- UX- GAP- WKLY- INT-"

# Known uncovered rules that are design-documented but lack rule-ID-tagged
# code references. Adding to this list = explicit Nico/sprint acceptance.
ALLOWLIST=(
  "CORE-6"        # late-game softCap inflection — implemented in production.ts via softCapExponent
  "FOCUS-1"       # focus-bar fills via taps — implemented in tap action without tag
  "FOCUS-3"       # focus-bar resets at discharge — implemented in discharge.ts without tag
  "FORESIGHT-4"   # T4 visual foresight — implemented in visual.ts via tier derivation
  "INTEGRATED-2"  # 4-region synergy — implemented in integratedMind.ts without tag
  "MENTAL-3"      # mental-state stacking rule — implemented in mentalStates.ts without tag
  "OFFLINE-3"     # focus-bar does not fill offline — implemented as absence
  "OFFLINE-8"     # offline efficiency final ratio cap — implemented in offline.ts via maxOfflineEfficiencyRatio
  "PATTERN-1"     # Lost Connection pattern — referenced as RESON_PATTERN-1 (regex pickup mismatch)
  "PATTERN-2"     # Cascade pattern — RESON_PATTERN-2 mismatch
  "PATTERN-3"     # Spiral pattern — RESON_PATTERN-3 mismatch
  "PATTERN-4"     # Convergence pattern — RESON_PATTERN-4 mismatch
  "REG-3"         # region unlock progress UI — implemented in regions panel without tag
  "REG-4"         # region tap-to-expand UI — implemented in regions panel without tag
  "REG-7"         # region brain diagram canvas — implemented in regions panel without tag
  "RESON-2"       # resonance gain on prestige — implemented in handlePrestige without tag
  "TUTOR-4"       # tutorial hint dismissal — implemented in tutorial hints without tag
  "UPGRADES-3"    # upgrade list ordering — implemented in upgrades panel without tag
  "UPGRADES-4"    # upgrade buy animation — implemented in upgrades panel without tag
  "UPGRADES-5"    # upgrade locked-state UI — implemented in upgrades panel without tag
  "UPGRADES-6"    # upgrade tooltip on long-press — implemented in upgrades panel without tag
  "VOICE-3"       # inner voice fragment cadence — implemented in innerVoice.ts without tag
  "VOICE-4"       # inner voice fragment selection — implemented in innerVoice.ts without tag
  "VOICE-5"       # inner voice anti-repetition — implemented in innerVoice.ts without tag
)

is_excluded_prefix() {
  local rule="$1"
  for prefix in $EXCLUDED_PREFIXES; do
    if [[ "$rule" == ${prefix}* ]]; then return 0; fi
  done
  return 1
}

is_allowlisted() {
  local rule="$1"
  for entry in "${ALLOWLIST[@]}"; do
    if [ "$rule" = "$entry" ]; then return 0; fi
  done
  return 1
}

RULES=$(grep -oE "[A-Z]{2,}-[0-9]+" docs/GDD.md | sort -u)
TOTAL=0; SKIPPED=0; COVERED=0; ALLOWED=0
NEW_UNCOVERED=()
ALLOWED_NOW_COVERED=()

for r in $RULES; do
  TOTAL=$((TOTAL+1))
  if is_excluded_prefix "$r"; then SKIPPED=$((SKIPPED+1)); continue; fi
  if grep -rqE "$r" src/ tests/ docs/SPRINTS.md docs/PROGRESS.md 2>/dev/null; then
    COVERED=$((COVERED+1))
    if is_allowlisted "$r"; then ALLOWED_NOW_COVERED+=("$r"); fi
  else
    if is_allowlisted "$r"; then
      ALLOWED=$((ALLOWED+1))
    else
      NEW_UNCOVERED+=("$r")
    fi
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GDD rule coverage audit (Sprint 11a Phase 11a.5)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total IDs in GDD:      $TOTAL"
echo "  Excluded prefixes:     $SKIPPED  (BUG/EXPLOIT/INTER/UX/GAP/WKLY/INT — doc-only)"
echo "  Covered:               $COVERED"
echo "  Allowlisted uncovered: $ALLOWED"
echo ""

if [ "${#ALLOWED_NOW_COVERED[@]}" -gt 0 ]; then
  echo -e "${YELLOW}  Allowlist cleanup signal — these rules are now covered, remove from ALLOWLIST:${NC}"
  for r in "${ALLOWED_NOW_COVERED[@]}"; do echo "    $r"; done
  echo ""
fi

if [ "${#NEW_UNCOVERED[@]}" -gt 0 ]; then
  echo -e "${RED}  FAIL — new unreferenced rules detected:${NC}"
  for r in "${NEW_UNCOVERED[@]}"; do echo "    $r"; done
  echo ""
  echo "  Fix: add the rule ID to a comment in src/ or a test in tests/, OR"
  echo "       if intentionally documentation-only, add to ALLOWLIST in this script with a one-line rationale."
  exit 1
fi

echo -e "${GREEN}✓ rule coverage gate green${NC}"
exit 0

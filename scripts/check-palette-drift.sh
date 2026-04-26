#!/bin/bash
# Sprint 11a Phase 11a.5 — palette drift audit per SPRINTS.md §Sprint 11a
# line 1020-1026. Compares hex values in docs/UI_MOCKUPS.html against
# src/ui/tokens.ts COLORS entries and flags drift in either direction.
#
# Context: drift caught and corrected in Sprint 2 Phase 2 pre-code
# (#4060E0 vs canonical #4090E0 in UI_MOCKUPS lines 42+47). This automated
# check prevents recurrence as UI_MOCKUPS extends with Sprint 5-10 screens.
#
# Allowlist: hex values that legitimately exist on only one side because
# the other doesn't yet need them (mockup-only shading variants, or
# token-only values for screens not yet mocked up like Memory Shards).
#
# Usage: bash scripts/check-palette-drift.sh
# Exit 0: no unallowlisted drift
# Exit 1: new drift detected

set -e
cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Hex values that legitimately appear ONLY in UI_MOCKUPS (mockup-only
# shading or surface variants not yet abstracted as design tokens).
# All values match the bioluminescent palette family.
MOCKUP_ONLY_ALLOWLIST=(
  "#03050c"  # deeper-than-bgDeep variant for splash backgrounds in mockup
  "#0f1224"  # mid-shade between bgDeep and bgElevated for layered surfaces
  "#60D0A0"  # softer cyan/green variant — used in mockup hover/active states
  "#80B8F0"  # softer blue variant — used in mockup secondary states
  "#B0A8F0"  # softer primary lavender variant — used in mockup hover/active
  "#F0A0A0"  # softer pink/red variant — used in mockup gentle warnings
  "#fff"     # short-form #ffffff — equivalent to existing #ffffff usage
  "#ffffff"  # plain white — used in border opacities (#ffffff14/20/30 in tokens)
)

# Hex values that legitimately appear ONLY in tokens.ts (screens / features
# not yet present in UI_MOCKUPS). Updated in lockstep when mockups extend.
TOKENS_ONLY_ALLOWLIST=(
  "#FFF0C0"  # consciousnessBarP26 — Era 3 finale, no mockup of P26 ending yet
  "#F472B6"  # shardEmotional — Sprint 7.5.2 Hipocampo panel, no mockup yet
  "#60A5FA"  # shardProcedural — same
  "#22D3EE"  # shardEpisodic — same
)

is_in_array() {
  local needle="$1"; shift
  for item in "$@"; do
    # Case-insensitive comparison since hex codes can be #abc or #ABC.
    if [ "${needle,,}" = "${item,,}" ]; then return 0; fi
  done
  return 1
}

# Extract hex codes (3-char and 6-char), normalize to lowercase, dedupe.
MOCKUP_HEX=$(grep -oE "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}\b" docs/UI_MOCKUPS.html | sort -u)
TOKEN_HEX=$(grep -oE "'#[0-9A-Fa-f]{6}'|'#[0-9A-Fa-f]{3}'\b" src/ui/tokens.ts | tr -d "'" | sort -u)

MOCKUP_NOT_IN_TOKENS=()
TOKENS_NOT_IN_MOCKUP=()

for hex in $MOCKUP_HEX; do
  if ! echo "$TOKEN_HEX" | grep -iqE "^${hex}$"; then
    if ! is_in_array "$hex" "${MOCKUP_ONLY_ALLOWLIST[@]}"; then
      MOCKUP_NOT_IN_TOKENS+=("$hex")
    fi
  fi
done

for hex in $TOKEN_HEX; do
  if ! echo "$MOCKUP_HEX" | grep -iqE "^${hex}$"; then
    if ! is_in_array "$hex" "${TOKENS_ONLY_ALLOWLIST[@]}"; then
      TOKENS_NOT_IN_MOCKUP+=("$hex")
    fi
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Palette drift audit (Sprint 11a Phase 11a.5)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  UI_MOCKUPS hex codes:  $(echo "$MOCKUP_HEX" | wc -l | tr -d ' ')"
echo "  tokens.ts hex codes:   $(echo "$TOKEN_HEX" | wc -l | tr -d ' ')"
echo ""

FAIL=0
if [ "${#MOCKUP_NOT_IN_TOKENS[@]}" -gt 0 ]; then
  echo -e "${RED}  FAIL — new mockup hex not in tokens (and not allowlisted):${NC}"
  for hex in "${MOCKUP_NOT_IN_TOKENS[@]}"; do echo "    $hex"; done
  FAIL=1
fi

if [ "${#TOKENS_NOT_IN_MOCKUP[@]}" -gt 0 ]; then
  echo -e "${RED}  FAIL — new tokens hex not in mockup (and not allowlisted):${NC}"
  for hex in "${TOKENS_NOT_IN_MOCKUP[@]}"; do echo "    $hex"; done
  FAIL=1
fi

if [ "$FAIL" = "1" ]; then
  echo ""
  echo "  Fix: either (a) align the missing side, OR (b) add to the allowlist with rationale."
  exit 1
fi

echo -e "${GREEN}✓ palette drift gate green${NC}"
exit 0

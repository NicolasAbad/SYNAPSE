#!/bin/bash
# check-invention.sh — verification gates to catch silent invention by Claude Code
#
# Runs 4 gates. Any failure blocks the commit.
# Called from: pre-commit hook + npm run check-invention + CI.
#
# Usage: bash scripts/check-invention.sh

set -e
cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAIL=0
WARNINGS=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SYNAPSE anti-invention verification gates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─────────────────────────────────────────────────
# GATE 1: No hardcoded numerics in src/engine/
# ─────────────────────────────────────────────────
echo "Gate 1/4: No hardcoded numerics in engine code"

if [ -d "src/engine" ]; then
  # Find numeric literals that are NOT:
  # - 0, 1, -1 (allowed as indices, boolean-ish, sentinels)
  # - in comments
  # - in const declarations that reference SYNAPSE_CONSTANTS
  # - explicitly marked with // CONST-OK comment (escape hatch for proven cases)

  # grep output is "file:lineno:content"; strip the prefix before applying
  # code-vs-comment filters so they match the actual code line (not the prefix).
  HITS=$(grep -rnE "[^a-zA-Z_0-9]([2-9]|[1-9][0-9]+|0\.[0-9]+|-[2-9]|-[1-9][0-9]+)[^a-zA-Z_0-9]" src/engine/ \
    --include="*.ts" \
    --include="*.tsx" 2>/dev/null \
    | grep -vE '^[^:]+:[0-9]+:\s*//' \
    | grep -vE '^[^:]+:[0-9]+:\s*\*' \
    | grep -vE '^[^:]+:[0-9]+:\s*/\*' \
    | grep -v "CONST-OK" \
    | grep -v "SYNAPSE_CONSTANTS\." \
    | grep -v "from.*constants" \
    | grep -vE "Math\.(floor|ceil|round|min|max|abs|pow|log|sqrt|imul)\(" \
    | grep -vE '\[\d+\]' \
    | grep -vE 'case \d+' \
    | grep -vE '\.length.*===.*\d+' \
    | grep -vE '\$\{\d+\}' \
    || true)

  if [ -n "$HITS" ]; then
    echo -e "${RED}  FAIL${NC} — hardcoded numerics found in src/engine/:"
    echo "$HITS" | head -10 | sed 's/^/    /'
    HIT_COUNT=$(echo "$HITS" | wc -l | tr -d ' ')
    if [ "$HIT_COUNT" -gt 10 ]; then
      echo "    ... and $((HIT_COUNT - 10)) more"
    fi
    echo "    Fix: move value to src/config/constants.ts, or if truly constant (e.g. array index) annotate with // CONST-OK"
    FAIL=1
  else
    echo -e "${GREEN}  PASS${NC} — no hardcoded numerics in engine"
  fi
else
  echo -e "${YELLOW}  SKIP${NC} — src/engine/ not yet created"
fi

echo ""

# ─────────────────────────────────────────────────
# GATE 2: GDD references present in engine files
# ─────────────────────────────────────────────────
echo "Gate 2/4: GDD section references in engine files"

if [ -d "src/engine" ]; then
  MISSING_REFS=()
  # Use find instead of glob (globstar requires bash option; find is portable)
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    if ! grep -qE "GDD\.md §|docs/GDD\.md §" "$f" 2>/dev/null; then
      MISSING_REFS+=("$f")
    fi
  done < <(find src/engine -type f -name "*.ts" 2>/dev/null)

  if [ ${#MISSING_REFS[@]} -gt 0 ]; then
    echo -e "${YELLOW}  WARN${NC} — engine files without GDD section reference:"
    for f in "${MISSING_REFS[@]}"; do
      echo "    $f"
    done
    echo "    Fix: add top-of-file comment: // Implements docs/GDD.md §N (Feature Name)"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}  PASS${NC} — all engine files reference GDD sections"
  fi
else
  echo -e "${YELLOW}  SKIP${NC} — src/engine/ not yet created"
fi

echo ""

# ─────────────────────────────────────────────────
# GATE 3: Constants coverage ratio
# ─────────────────────────────────────────────────
echo "Gate 3/4: Constants coverage ratio (>0.8 target)"

if [ -d "src" ]; then
  # Count references to SYNAPSE_CONSTANTS in src/
  CONST_REFS=$(grep -rE "SYNAPSE_CONSTANTS\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

  # Count numeric literals in src/ (excluding 0, 1, -1, obvious cases).
  # Same comment-prefix fix as Gate 1.
  # Exclude src/config/ wholesale — config modules ARE the canonical spec-value
  # storage layer that Gate 1 directs inventions TO (moving literals into config
  # is the fix). Counting config values as "literals" makes the target unreachable.
  NUM_LITERALS=$(grep -rnE "[^a-zA-Z_0-9]([2-9]|[1-9][0-9]+|0\.[0-9]+)[^a-zA-Z_0-9]" src/ \
    --include="*.ts" \
    --include="*.tsx" 2>/dev/null \
    | grep -vE '^[^:]+:[0-9]+:\s*//' \
    | grep -vE '^[^:]+:[0-9]+:\s*\*' \
    | grep -vE '^[^:]+:[0-9]+:\s*/\*' \
    | grep -v "CONST-OK" \
    | grep -v "src/config/" \
    | wc -l | tr -d ' ')

  if [ "$CONST_REFS" -eq 0 ] && [ "$NUM_LITERALS" -eq 0 ]; then
    echo -e "${YELLOW}  SKIP${NC} — no code in src/ yet to analyze"
  elif [ "$CONST_REFS" -eq 0 ]; then
    echo -e "${RED}  FAIL${NC} — 0 constants referenced, $NUM_LITERALS numeric literals found"
    FAIL=1
  else
    # Python for float math since bash can't do floats
    RATIO=$(python3 -c "print(f'{$CONST_REFS / ($CONST_REFS + $NUM_LITERALS):.2f}')" 2>/dev/null || echo "0.5")
    RATIO_OK=$(python3 -c "print('yes' if $CONST_REFS / ($CONST_REFS + $NUM_LITERALS) >= 0.8 else 'no')" 2>/dev/null || echo "no")

    if [ "$RATIO_OK" = "yes" ]; then
      echo -e "${GREEN}  PASS${NC} — ratio = $RATIO (constants: $CONST_REFS, literals: $NUM_LITERALS)"
    else
      echo -e "${RED}  FAIL${NC} — ratio = $RATIO (constants: $CONST_REFS, literals: $NUM_LITERALS, target: ≥0.80)"
      echo "    Fix: replace numeric literals with SYNAPSE_CONSTANTS references"
      FAIL=1
    fi
  fi
else
  echo -e "${YELLOW}  SKIP${NC} — src/ not yet created"
fi

echo ""

# ─────────────────────────────────────────────────
# GATE 4: Consistency tests pass
# ─────────────────────────────────────────────────
echo "Gate 4/4: Consistency tests (tests/consistency.test.ts)"

if [ -f "tests/consistency.test.ts" ] || [ -f "src/tests/consistency.test.ts" ]; then
  # Only run if vitest is available (package.json exists with vitest installed)
  if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}  SKIP${NC} — package.json not yet created (pre-Sprint-1 state)"
  elif ! command -v npx >/dev/null 2>&1 || ! npx --no-install vitest --version >/dev/null 2>&1; then
    echo -e "${YELLOW}  SKIP${NC} — vitest not installed yet (run \`npm install\` in Sprint 1)"
  else
    # Run just the consistency tests
    if npx vitest run tests/consistency.test.ts --reporter=default 2>&1 | tail -20 | grep -qE "Tests\s+\d+\s+passed|PASS|passed"; then
      echo -e "${GREEN}  PASS${NC} — consistency tests green"
    else
      echo -e "${RED}  FAIL${NC} — consistency tests failing"
      echo "    Run: npx vitest run tests/consistency.test.ts to see which invariants broke"
      FAIL=1
    fi
  fi
else
  echo -e "${YELLOW}  SKIP${NC} — tests/consistency.test.ts not yet created"
  echo "    (will be created in Sprint 1)"
fi

echo ""

# ─────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -eq 1 ]; then
  echo -e "${RED}✗ INVENTION CHECK FAILED${NC}"
  echo ""
  echo "Silent invention detected. Review the output above."
  echo "Common fixes:"
  echo "  1. Move hardcoded number to src/config/constants.ts"
  echo "  2. Add GDD reference comment at top of file"
  echo "  3. Update consistency test assertions if intentional"
  echo "  4. Use // CONST-OK if value truly is intrinsic (rare)"
  echo ""
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠  $WARNINGS warning(s)${NC} (not blocking, but address soon)"
  echo ""
fi

echo -e "${GREEN}✓ All gates passed${NC}"
echo ""
exit 0

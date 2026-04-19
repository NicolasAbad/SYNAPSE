import { describe, test, expect } from 'vitest';
import { wrapText } from '../../../src/ui/util/wrapText';

// Mock CanvasRenderingContext2D with a predictable measureText.
// Each character = 10px wide (matches easily hand-computable expectations).
function makeMockCtx(charWidth = 10): CanvasRenderingContext2D {
  return {
    measureText: (s: string) => ({ width: s.length * charWidth }),
  } as unknown as CanvasRenderingContext2D;
}

describe('wrapText', () => {
  test('empty string → empty array', () => {
    expect(wrapText(makeMockCtx(), '', 100)).toEqual([]);
  });

  test('whitespace-only string → empty array', () => {
    expect(wrapText(makeMockCtx(), '   ', 100)).toEqual([]);
  });

  test('single word fitting on one line', () => {
    expect(wrapText(makeMockCtx(), 'hello', 100)).toEqual(['hello']);
  });

  test('multiple words that all fit on one line', () => {
    // "a b c" = 5 chars × 10 = 50px < 100
    expect(wrapText(makeMockCtx(), 'a b c', 100)).toEqual(['a b c']);
  });

  test('greedy wrap when candidate exceeds maxWidth', () => {
    // "hello world" = 11 chars × 10 = 110px > 100 → wraps
    expect(wrapText(makeMockCtx(), 'hello world', 100)).toEqual(['hello', 'world']);
  });

  test('single word wider than maxWidth is placed alone (no mid-word break)', () => {
    // "verylongword" = 12 chars × 10 = 120px > 100 → alone on its line
    expect(wrapText(makeMockCtx(), 'verylongword', 100)).toEqual(['verylongword']);
  });

  test('multi-line wrap preserving word order', () => {
    // charWidth 10, maxWidth 50. Each word ≤ 5 chars.
    // "aaa bbb ccc ddd" → candidate "aaa bbb" = 7 chars × 10 = 70 > 50, so "aaa" alone;
    // then "bbb ccc" = 70 > 50, so "bbb" alone; etc.
    expect(wrapText(makeMockCtx(), 'aaa bbb ccc ddd', 50)).toEqual([
      'aaa',
      'bbb',
      'ccc',
      'ddd',
    ]);
  });

  test('collapses multiple whitespace into single word boundaries', () => {
    expect(wrapText(makeMockCtx(), 'a   b\t\tc', 100)).toEqual(['a b c']);
  });
});

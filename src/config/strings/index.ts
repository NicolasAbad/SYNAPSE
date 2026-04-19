// t(key) — dot-notation lookup into en strings.
// Missing keys return the key itself (visible debug marker,
// not crash — CODE-8 "never throw in engine" principle).

import { en } from './en';

type NestedStringObject = { [key: string]: string | NestedStringObject };

function flatten(obj: NestedStringObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      result[path] = v;
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(result, flatten(v, path));
    }
  }
  return result;
}

const flatStrings = flatten(en as unknown as NestedStringObject);

export function t(key: string): string {
  return flatStrings[key] ?? key;
}

export type Strings = typeof en;

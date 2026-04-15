import { EN_STRINGS, type StringKey } from './en';

const DICTIONARY = EN_STRINGS;

export function t(key: StringKey): string {
  return DICTIONARY[key];
}

export type { StringKey };

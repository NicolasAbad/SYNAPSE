export interface Mutation {
  id: string;
  name: string;
  bonus: { kind: string; value: number };
  tradeoff: { kind: string; value: number } | null;
}

/** Oracle is read-only — no actions. Stub kept for future use. */
export type AetherisAction = never;
export function parseActions(_reply: string): { prose: string; actions: never[] } {
  return { prose: _reply, actions: [] };
}

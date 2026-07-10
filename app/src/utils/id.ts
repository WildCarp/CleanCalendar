/** Generate a UUID v4 using crypto.randomUUID() */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Generate a timestamp (ms since epoch) */
export function now(): number {
  return Date.now();
}

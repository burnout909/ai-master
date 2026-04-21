const PATTERNS: RegExp[] = [
  /그냥\s*답/,
  /답만/,
  /skip/i,
  /빨리\s*(설명|알려|말)/,
  /설명만/,
  /just\s+tell\s+me/i,
  /바로\s*(답|알려)/,
];

export function detectSkipIntent(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}

import type { Flavor, Request } from './types';

/**
 * Taste-profile checks: warn when a pairing tips the balance,
 * like white chocolate on a "not too sweet" request.
 */
export function balanceWarnings(picks: Flavor[], request: Request): string[] {
  const words = request.words.toLowerCase();
  const out: string[] = [];
  if (/not (too|very|overly) sweet|less sweet/.test(words)) {
    for (const f of picks) if (f.profile.sweet >= 4) out.push(`${f.name} adds a lot of sweetness, and they asked for not too sweet.`);
  }
  if (picks.length >= 2) {
    const avg = (k: keyof Flavor['profile']) => picks.reduce((s, f) => s + f.profile[k], 0) / picks.length;
    if (avg('sweet') >= 4 && avg('sour') < 1 && avg('bitter') < 1) {
      out.push('Every flavor leans sweet. Something sour or bitter (citrus, berries, coffee, dark chocolate) would balance it.');
    }
  }
  return out;
}

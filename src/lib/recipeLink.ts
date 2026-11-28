/**
 * Read the schema.org Recipe data most recipe sites publish as JSON-LD.
 * Pasted links are cited as sources; sites without it fall back to the prompt.
 */

export interface LinkedRecipe {
  title: string;
  url: string;
  author: string | null;
  ingredientLines: string[]; // raw lines; amounts parsed later
  steps: string[];
  yield: string | null;
}

type Json = Record<string, unknown>;

function asArray<T>(v: T | T[] | undefined | null): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

function isRecipe(node: Json): boolean {
  return asArray(node['@type'] as string | string[]).some((t) => String(t).toLowerCase() === 'recipe');
}

function findRecipe(node: unknown): Json | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
    return null;
  }
  const obj = node as Json;
  if (isRecipe(obj)) return obj;
  return findRecipe(obj['@graph']);
}

function stepTexts(v: unknown): string[] {
  return asArray(v as unknown[]).flatMap((s) => {
    if (typeof s === 'string') return [s.trim()];
    const o = s as Json;
    if (o?.['@type'] === 'HowToSection') return stepTexts(o.itemListElement);
    return typeof o?.text === 'string' ? [o.text.trim()] : [];
  });
}

export function extractRecipe(html: string, url: string): LinkedRecipe | null {
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const b of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const r = findRecipe(data);
    if (!r) continue;
    const author = asArray(r.author as Json | Json[] | string)
      .map((a) => (typeof a === 'string' ? a : (a?.name as string)))
      .filter(Boolean)[0];
    return {
      title: String(r.name ?? 'Untitled recipe'),
      url,
      author: author ?? null,
      ingredientLines: asArray(r.recipeIngredient as string[]).map((s) => String(s).trim()),
      steps: stepTexts(r.recipeInstructions),
      yield: asArray(r.recipeYield as string[]).map(String)[0] ?? null,
    };
  }
  return null;
}

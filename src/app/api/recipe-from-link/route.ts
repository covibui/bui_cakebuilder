import { extractRecipe } from '@/lib/recipeLink';

// Recipe sites block browser fetches (CORS), so the link is read on the server.
export async function POST(request: Request) {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  let parsed: URL;
  try {
    parsed = new URL(String(url));
  } catch {
    return Response.json({ error: 'That is not a valid link.' }, { status: 400 });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return Response.json({ error: 'Only web links are supported.' }, { status: 400 });
  }
  const res = await fetch(parsed, { headers: { 'user-agent': 'CakeBuilder/0.1 (personal recipe planner)' } }).catch(() => null);
  if (!res?.ok) return Response.json({ error: 'Could not open that page.' }, { status: 502 });
  const recipe = extractRecipe(await res.text(), parsed.toString());
  if (!recipe) return Response.json({ error: 'No recipe data on that page. Use Copy prompt instead.', fallback: 'prompt' }, { status: 422 });
  return Response.json({ recipe });
}

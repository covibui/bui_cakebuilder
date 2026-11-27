# Cake Builder

A personal PWA for planning ambitious cakes, cheesecakes, tarts and ice cream cakes. You pick flavors, then components, then size. The app gives you scaled recipes with cited sources, a shopping list and a bake timeline.

## v1 decisions
- **PWA**: Next.js (App Router) + Tailwind, hosted on Vercel free tier.
- **Storage**: device only (IndexedDB via Dexie), built so sync can be added later.
- **AI**: copy-prompt handoff. The app writes the prompt, you paste it into Claude and paste the JSON reply back. A built-in API key can replace this later without a rewrite.
- **Units**: cups by default with a grams toggle, grams always when a scale is needed, °F always.

The full data model lives in the "Cake Builder — Data Model v1" doc.

## Code map
| File | What it does |
| --- | --- |
| `src/lib/types.ts` | Data model v1 types |
| `src/lib/db.ts` | IndexedDB tables; seeds the flavor library |
| `src/lib/scaling.ts` | Pan area scaling, rounding, tier suggestions |
| `src/lib/units.ts` | Cups/grams display, °F |
| `src/lib/plan.ts` | Scaled components (incl. foundation feeds), shopping list, timeline, gaps |
| `src/lib/citations.ts` | `{A1\|text}` citation marks; assumption → tested |
| `src/lib/handoff.ts` | Copy-prompt builder and reply validator |
| `src/lib/recipeLink.ts` + `src/app/api/recipe-from-link` | Reads schema.org recipe data from pasted links |
| `src/lib/balance.ts` | Taste-profile warnings |
| `src/lib/flavors.ts` | 26-flavor seed library |
| `src/lib/templates.ts`, `stack.ts` | Starting components per dessert type; cross-section bands |
| `src/lib/ingredientLine.ts` | Reads "1 ½ cups sugar" lines from links and manual entry |
| `src/lib/bakeLog.ts` | Bake log → your note leads the recipe, guesses become tested |
| `src/lib/repo.ts` | Database operations and live-query hooks |
| `src/components/flow/*` | The story: request → how to build → flavors → inside → size → build → cook → log |
| `public/sw.js` | Offline: saved cakes and cook mode open with no connection |

## Run
```bash
npm install
npm run dev   # http://localhost:3000
npm test      # logic tests
```

import type { DessertType, Flavor, TasteProfile } from './types';

// Seed library from "Data Model v1 → Flavor library draft", after the designer's cut. Basque moved from flavors to cheesecake styles (25 rows).
// Taste profiles are estimates (profileIsAssumed: true) until sourced.

const PAPERLUST = { title: 'Paperlust: Wedding Cake Flavors 2026', url: 'https://paperlust.co/blog/wedding-cake-flavors/' };
const VEENA = { title: 'Veena Azmanov: Cake Flavor Combinations', url: 'https://veenaazmanov.com/cake-flavor-combinations/' };
const CALJAVA = { title: 'CalJava: Top 10 Cake Flavors for 2026', url: 'https://caljavaonline.com/blogs/news/top-10-cake-flavors-for-2026-make-your-cakes-stand-out-this-year' };
const GOLDBELLY = { title: 'Goldbelly: Types of Cheesecake', url: 'https://blog.goldbelly.com/different-types-of-cheesecake/' };
const EDIBLE = { title: 'Edible Arrangements: Types of Cheesecakes', url: 'https://blog.ediblearrangements.com/types-of-cheesecakes/' };

type Row = [name: string, category: DessertType, pairs: string, profile: [number, number, number, number, number], watchOut: string, sources: { title: string; url: string }[]];

const ROWS: Row[] = [
  ['Vanilla bean', 'cake', 'Raspberry jam, Lemon curd, Strawberry, Swiss meringue buttercream', [3, 0, 0, 0, 0], 'Reads plain alone; treat as a canvas', [PAPERLUST]],
  ['Chocolate', 'cake', 'Salted caramel, Espresso, Raspberry, Cherry, Peanut butter, Orange, Mint', [3, 0, 0, 3, 0], '', [VEENA]],
  ['Lemon', 'cake', 'Raspberry, Blueberry, Elderflower, Lemon curd, White chocolate', [2, 0, 4, 0, 0], '', [PAPERLUST]],
  ['White chocolate', 'cake', 'Raspberry compote, Champagne, Vanilla', [5, 0, 0, 0, 0], 'Adds sweetness', [PAPERLUST]],
  ['Strawberry', 'cake', 'Mascarpone, Matcha, Banana, Vanilla', [3, 0, 2, 0, 0], '', [VEENA]],
  ['Almond', 'cake', 'Raspberry, White chocolate', [2, 0, 0, 1, 0], '', [VEENA]],
  ['Carrot', 'cake', 'Cream cheese, Warm spice', [3, 0, 1, 0, 0], '', [PAPERLUST]],
  ['Red velvet', 'cake', 'Cream cheese', [3, 0, 1, 1, 0], '', [VEENA]],
  ['Coconut', 'cake', 'Mango-passion fruit, Pineapple, Lime, Rum', [3, 0, 0, 0, 0], '', [PAPERLUST]],
  ['Pistachio', 'cake', 'Raspberry, Sour cherry, Rose, Brown butter, Mascarpone', [2, 1, 0, 0, 1], 'Biggest rising flavor of 2026', [PAPERLUST]],
  ['Chocolate pistachio (Dubai style)', 'cake', 'Pistachio cream, Kataifi crunch, Ganache', [3, 1, 0, 3, 1], 'Labor-intensive', [CALJAVA]],
  ['Earl Grey', 'cake', 'Bergamot curd, Honey mascarpone, Lavender', [2, 0, 1, 2, 0], '', [PAPERLUST]],
  ['Matcha', 'cake', 'Yuzu, Strawberry, White chocolate, Blueberry', [1, 0, 0, 3, 1], '', [PAPERLUST]],
  ['Olive oil', 'cake', 'Lemon curd, Rosemary honey', [2, 1, 0, 1, 0], '', [PAPERLUST]],
  ['Chili chocolate', 'cake', 'Chocolate', [2, 0, 0, 3, 0], 'Keep the heat subtle', [CALJAVA]],
  ['Funfetti', 'cake', 'Vanilla bean, White chocolate', [5, 0, 0, 0, 0], '', [CALJAVA]],
  ['Pumpkin spice', 'cake', 'Maple, Cream cheese', [3, 0, 0, 0, 0], 'Fall only', [VEENA]],
  ['Gingerbread', 'cake', 'Lemon glaze, Cream cheese', [3, 0, 0, 1, 0], 'Winter only', [PAPERLUST]],
  ['White chocolate macadamia', 'cake', 'Blond chocolate, Praline, Feuilletine', [5, 1, 0, 0, 0], 'Cookie to cake; from your last build', []],
  ['Cookies and creme', 'cake', 'Chocolate, Vanilla', [4, 0, 0, 2, 0], 'Cookie to cake; from your discovery answers', []],
  ['Plain (classic)', 'cheesecake', 'Strawberry, Cherry, Sour cream topping', [3, 1, 2, 0, 0], '', [GOLDBELLY]],
  ['Key lime', 'cheesecake', 'Graham crust, Whipped cream', [3, 0, 4, 0, 0], '', [EDIBLE]],
  ['White chocolate raspberry', 'cheesecake', 'Raspberry swirl', [5, 0, 2, 0, 0], 'Can run very sweet', [EDIBLE]],
  ['Lemon', 'tart', 'Meringue, Berries', [2, 0, 5, 0, 0], '', []],
  ['Chocolate ganache', 'tart', 'Salted caramel, Raspberry, Sea salt', [3, 1, 0, 3, 0], '', []],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const SEED_FLAVORS: Flavor[] = ROWS.map(([name, category, pairs, p, watchOut, sources]) => {
  const profile: TasteProfile = { sweet: p[0], salty: p[1], sour: p[2], bitter: p[3], umami: p[4] };
  return {
    id: `${category}-${slug(name)}`,
    name,
    category,
    pairsWith: pairs.split(',').map((s) => s.trim()),
    profile,
    profileIsAssumed: true,
    watchOut,
    origin: 'library',
    sources,
  };
});

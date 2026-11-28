import type { CakeStyle, ComponentKind, ComponentTag, DessertType, TartStyle } from './types';

export interface ComponentTemplate {
  kind: ComponentKind;
  name: string;
  why: string;
  tag: ComponentTag;
  included: boolean;
  makeAheadDay: number;
}

/**
 * Starting components per dessert type, before any AI help.
 * Names take the primary flavor ("Lemon sponge"). Make-ahead days follow v6.
 * Cake and tart styles override the base list (pies, tarts & other cakes research, 2026-11-27).
 */
const BASE: Record<DessertType, ComponentTemplate[]> = {
  cake: [
    { kind: 'sponge', name: '{f} sponge', why: 'The base layer of any layer cake', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'soak', name: '{f} syrup soak', why: 'Keeps the sponge moist', tag: 'suggested', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{f} filling', why: 'Adds flavor between layers', tag: 'suggested', included: true, makeAheadDay: -2 },
    { kind: 'insert', name: '{p} insert', why: 'A second flavor in the middle', tag: 'suggested', included: false, makeAheadDay: -2 },
    { kind: 'frosting', name: '{f} buttercream', why: 'Covers and holds the cake together', tag: 'suggested', included: true, makeAheadDay: 0 },
    { kind: 'crunch', name: 'Crunch layer', why: 'Optional texture between layers', tag: 'optional', included: false, makeAheadDay: -1 },
  ],
  cheesecake: [
    { kind: 'crust', name: 'Cookie crust', why: 'The base of most cheesecakes (Basque has none)', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'base', name: '{f} cheesecake filling', why: 'Baked or set the day before so it can chill overnight', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'insert', name: '{p} topping', why: 'Fruit or sauce to cut the richness', tag: 'suggested', included: true, makeAheadDay: 0 },
  ],
  tart: [
    { kind: 'crust', name: 'Tart shell', why: 'Blind baked, then filled once cool', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{f} pastry cream', why: 'The main layer, set in the baked shell', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'topping', name: '{p} fruit', why: 'Arranged on top at the end', tag: 'suggested', included: true, makeAheadDay: 0 },
    { kind: 'glaze', name: 'Apricot glaze', why: 'Shines the fruit and keeps it fresh', tag: 'optional', included: false, makeAheadDay: 0 },
  ],
  'ice-cream-cake': [
    { kind: 'sponge', name: '{f} chiffon layer', why: 'Oil-based chiffon stays softer frozen than butter cake', tag: 'base', included: true, makeAheadDay: -2 },
    { kind: 'base', name: '{f} ice cream', why: 'The main layer; softened, then frozen between layers', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'crunch', name: 'Fudge crunch layer', why: 'Fudge glues the cake and ice cream together', tag: 'suggested', included: true, makeAheadDay: -1 },
    { kind: 'frosting', name: 'Whipped cream finish', why: 'Frosted on a frozen plate, then frozen at least 12 hours', tag: 'suggested', included: true, makeAheadDay: -1 },
  ],
};

const CAKE_STYLE: Partial<Record<CakeStyle, ComponentTemplate[]>> = {
  entremet: [
    { kind: 'insert', name: '{p} insert', why: 'Frozen first so it holds its shape inside the mousse', tag: 'base', included: true, makeAheadDay: -3 },
    { kind: 'mousse', name: '{f} mousse', why: 'The body of the entremet; assembled around the insert, then frozen', tag: 'base', included: true, makeAheadDay: -2 },
    { kind: 'sponge', name: '{f} sponge base', why: 'A thin layer under the mousse', tag: 'suggested', included: true, makeAheadDay: -2 },
    { kind: 'crunch', name: 'Crunch base', why: 'Texture under the sponge', tag: 'optional', included: false, makeAheadDay: -2 },
    { kind: 'glaze', name: '{f} mirror glaze', why: 'Poured over the frozen cake', tag: 'suggested', included: true, makeAheadDay: -1 },
  ],
  cupcake: [
    { kind: 'sponge', name: '{f} cupcakes', why: 'A butter cake batter works best as cupcakes', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{p} filling', why: 'Piped into the center', tag: 'optional', included: false, makeAheadDay: -1 },
    { kind: 'frosting', name: '{f} buttercream', why: 'Piped on top', tag: 'suggested', included: true, makeAheadDay: 0 },
  ],
  bundt: [
    { kind: 'sponge', name: '{f} Bundt cake', why: 'A dense, tight-crumb batter, like pound cake', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'glaze', name: '{p} glaze', why: 'Poured over once cool', tag: 'suggested', included: true, makeAheadDay: 0 },
  ],
  chiffon: [
    { kind: 'sponge', name: '{f} chiffon cake', why: 'Light, oil-based and baked in a tube pan', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'topping', name: 'Whipped cream', why: 'Keeps it light', tag: 'suggested', included: true, makeAheadDay: 0 },
    { kind: 'topping', name: '{p} fruit', why: 'Served on the side', tag: 'optional', included: false, makeAheadDay: 0 },
  ],
  'angel-food': [
    { kind: 'sponge', name: '{f} angel food cake', why: 'A fat-free meringue cake; keeps 1 day ahead', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'topping', name: '{p} and whipped cream', why: 'Served on the side', tag: 'suggested', included: true, makeAheadDay: 0 },
  ],
  roll: [
    { kind: 'sponge', name: '{f} sponge sheet', why: 'A thin sponge, rolled while warm', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{p} filling', why: 'Spread on, then rolled up', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'topping', name: 'Powdered sugar or ganache', why: 'Finishes the outside', tag: 'optional', included: false, makeAheadDay: 0 },
  ],
};

const TART_STYLE: Partial<Record<TartStyle, ComponentTemplate[]>> = {
  baked: [
    { kind: 'crust', name: 'Tart shell', why: 'Chilled, then baked with the filling', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'filling', name: '{f} frangipane', why: 'Bakes under the fruit', tag: 'base', included: true, makeAheadDay: -1 },
    { kind: 'topping', name: '{p} fruit', why: 'Baked into the frangipane; pre-cook hard fruit', tag: 'suggested', included: true, makeAheadDay: -1 },
    { kind: 'glaze', name: 'Apricot glaze', why: 'Shines the top', tag: 'optional', included: false, makeAheadDay: 0 },
  ],
};

export function componentTemplates(type: DessertType, primary: string, pairing: string, variant?: string): ComponentTemplate[] {
  const f = primary || 'Vanilla';
  const p = pairing || 'Fruit';
  const list =
    (type === 'cake' && variant ? CAKE_STYLE[variant as CakeStyle] : undefined) ??
    (type === 'tart' && variant ? TART_STYLE[variant as TartStyle] : undefined) ??
    BASE[type];
  return list
    .map((t) => ({ ...t, name: t.name.replace('{f}', f).replace('{p}', p) }))
    .map((t) => (type === 'cheesecake' && variant === 'basque' && t.kind === 'crust' ? { ...t, included: false, why: 'Basque cheesecake has no crust' } : t));
}

export const DESSERT_LABEL: Record<DessertType, string> = {
  cake: 'Layer cake',
  cheesecake: 'Cheesecake',
  tart: 'Tart',
  'ice-cream-cake': 'Ice cream cake',
};

export const KIND_LABEL: Record<ComponentKind, string> = {
  sponge: 'Sponge', soak: 'Soak', filling: 'Filling', insert: 'Insert', frosting: 'Frosting',
  crunch: 'Crunch', crust: 'Crust', base: 'Base', mousse: 'Mousse', glaze: 'Glaze', topping: 'Topping', other: 'Other',
};

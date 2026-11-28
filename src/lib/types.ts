// Data Model v1 — see "Cake Builder — Data Model v1" doc.
// Stored tables: Project, Component, Layer, Recipe, Citation, BakeLog, Flavor.
// Request, FlavorPick and Size live inside Project.

export type ID = string;

export type DessertType = 'cake' | 'cheesecake' | 'tart' | 'ice-cream-cake';
export type ProjectStatus = 'planning' | 'baking' | 'baked';
export type BuildMode = 'know' | 'inspire' | 'blank';

export interface Request {
  forWho: string;
  occasion: string;
  date: string; // ISO date, may be empty while planning
  servings: number | null;
  words: string; // their own words, e.g. "lemony and bright, not too sweet"
}

export interface FlavorPick {
  primary: ID | null; // Flavor id
  pairings: ID[]; // Flavor ids
  custom: string[]; // "fill in your own" — researched, then added to the library
}

export type Shape = 'round' | 'square' | 'sheet' | 'oval' | 'dome' | 'cupcake';

export interface Tier {
  sizeIn: number; // diameter or side, inches; sheet uses 9x13 by default
  layers: number;
}

export interface Size {
  shape: Shape;
  tiers: Tier[];
  justEnough: boolean; // off = +10% safety margin
}

export interface Project {
  id: ID;
  title: string; // derived from flavors unless renamed
  titleIsCustom: boolean;
  dessertType: DessertType;
  status: ProjectStatus;
  buildMode: BuildMode;
  /** Cheesecake style; drives water bath, set and chill rules. Unset = baked. */
  variant?: 'baked' | 'no-bake' | 'basque';
  request: Request;
  flavors: FlavorPick;
  size: Size;
  createdAt: number;
  updatedAt: number;
}

export type ComponentKind =
  | 'sponge'
  | 'soak'
  | 'filling'
  | 'insert'
  | 'frosting'
  | 'crunch'
  | 'crust'
  | 'base'
  | 'other';

export type ComponentTag = 'base' | 'suggested' | 'from-request' | 'optional' | 'mine';

/** A foundation component can feed others, e.g. curd folded into buttercream. */
export interface Feed {
  componentId: ID;
  grams: number;
}

export interface Component {
  id: ID;
  projectId: ID;
  kind: ComponentKind;
  name: string;
  why: string; // why it was suggested
  tag: ComponentTag;
  included: boolean;
  makeAheadDay: number; // 0 = serving day, -1 = day before, -2 = two days before
  recipeId: ID | null;
  feeds: Feed[];
}

/** One band in the cross-section, bottom to top. */
export interface Layer {
  id: ID;
  projectId: ID;
  componentId: ID;
  order: number;
  tier: number; // index into Size.tiers
  thickness: number; // display only
}

export type IngredientUnit = 'g' | 'ml' | 'count';

export interface Ingredient {
  name: string;
  amount: number; // stored in grams, ml, or a count
  unit: IngredientUnit;
  needsScale: boolean; // always shown in grams
}

export interface Step {
  text: string; // inline citation marks: {A1|text}
  timer?: { label: string; seconds: number };
}

export type RecipeOrigin = 'link' | 'ai' | 'manual';

export interface BasePan {
  shape: Shape;
  sizeIn: number;
  layers: number;
}

/** Shared library: not owned by a project, so a tested recipe carries to the next cake. */
export interface Recipe {
  id: ID;
  title: string;
  basePan: BasePan;
  yieldGrams: number | null; // needed to size feeds into other components
  ingredients: Ingredient[];
  steps: Step[];
  origin: RecipeOrigin;
  sourceUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export type CitationKind = 'source' | 'assumption' | 'tested';

export interface Citation {
  id: ID; // matches the mark in step text, e.g. "A1"; unique per recipe
  recipeId: ID;
  kind: CitationKind;
  title: string;
  detail: string;
  why: string | null; // assumptions explain their reasoning
  refs: string[];
  url: string | null;
}

export type Verdict = 'worked' | 'change';

export interface BakeLog {
  id: ID;
  projectId: ID;
  bakedOn: string; // ISO date
  notes: string;
  results: { componentId: ID; verdict: Verdict; changeText: string }[];
  measured: { recipeId: ID; citationId: ID; value: string }[]; // promotes an assumption to tested
}

export interface TasteProfile {
  sweet: number; // 0–5
  salty: number;
  sour: number;
  bitter: number;
  umami: number;
}

export interface Flavor {
  id: ID;
  name: string;
  category: DessertType;
  pairsWith: string[];
  profile: TasteProfile;
  profileIsAssumed: boolean; // ratings are estimates until sourced
  watchOut: string;
  origin: 'library' | 'custom';
  sources: { title: string; url: string }[];
}

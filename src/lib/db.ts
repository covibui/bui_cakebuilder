import Dexie, { type EntityTable } from 'dexie';
import type { BakeLog, Citation, Component, Flavor, Layer, Project, Recipe } from './types';
import { SEED_FLAVORS } from './flavors';
import { flavorColor } from './cakeColors';

/** Device-only storage (IndexedDB). Built so cloud sync can be added later. */
export class CakeDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  components!: EntityTable<Component, 'id'>;
  layers!: EntityTable<Layer, 'id'>;
  recipes!: EntityTable<Recipe, 'id'>;
  citations!: Dexie.Table<Citation, [string, string]>;
  bakeLogs!: EntityTable<BakeLog, 'id'>;
  flavors!: EntityTable<Flavor, 'id'>;

  constructor() {
    super('cake-builder');
    this.version(1).stores({
      projects: 'id, status, updatedAt',
      components: 'id, projectId, recipeId',
      layers: 'id, projectId, [projectId+order]',
      recipes: 'id, title, origin',
      citations: '[recipeId+id], recipeId, kind',
      bakeLogs: 'id, projectId, bakedOn',
      flavors: 'id, name, category, origin',
    });
    // v2: flavors gain a cake color (Café Scrapbook cake palette).
    this.version(2).stores({}).upgrade((tx) =>
      tx.table('flavors').toCollection().modify((f: Flavor) => {
        if (!f.color) f.color = flavorColor(f.name, f.category);
      }),
    );
    this.on('populate', (tx) => {
      tx.table('flavors').bulkAdd(SEED_FLAVORS);
    });
  }
}

let instance: CakeDB | null = null;

/** Lazily open the database in the browser only. */
export function db(): CakeDB {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is only available in the browser');
  }
  if (!instance) instance = new CakeDB();
  return instance;
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

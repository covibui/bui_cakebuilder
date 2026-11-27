import type { Project } from './types';

/**
 * Process rules for desserts that don't behave like sponge cakes.
 * From the cheesecake / ice cream cake research pass (2026-11-27); every rule cites its source.
 */

export interface Source {
  title: string;
  url: string;
}

export interface ProcessTask {
  offset: number; // 0 = serving day
  text: string;
  source: Source;
}

export interface ProcessTip {
  text: string;
  source: Source;
}

const SALLY_CRACKS = { title: "Sally's Baking Addiction: How to Prevent Cracks in Cheesecake", url: 'https://sallysbakingaddiction.com/prevent-cracks-cheesecake/' };
const SALLY_CLASSIC = { title: "Sally's Baking Addiction: Classic Cheesecake", url: 'https://sallysbakingaddiction.com/classic-cheesecake/' };
const RTE_NOBAKE = { title: 'RecipeTin Eats: No-Bake Cheesecake', url: 'https://www.recipetineats.com/no-bake-cheesecake/' };
const FOODREPUBLIC = { title: 'Food Republic: No-Bake vs Baked Cheesecake', url: 'https://www.foodrepublic.com/1722023/no-bake-vs-baked-cheesecake-differences' };
const PREPPY_GUIDE = { title: 'Preppy Kitchen: Cheesecake Guide', url: 'https://preppykitchen.com/cheesecake-guide/' };
const SALLY_ICC = { title: "Sally's Baking Addiction: Ice Cream Cake", url: 'https://sallysbakingaddiction.com/ice-cream-cake/' };
const SALLY_5LAYER = { title: "Sally's Baking Addiction: Easy 5 Layer Ice Cream Cake", url: 'https://sallysbakingaddiction.com/easy-5-layer-ice-cream-cake' };
const ATK = { title: "America's Test Kitchen: The Ultimate Ice Cream Cake", url: 'https://www.americastestkitchen.com/articles/5116-how-to-make-the-ultimate-ice-cream-cake' };
const FOODNETWORK_ICC = { title: 'Food Network: How to Make an Ice Cream Cake', url: 'https://www.foodnetwork.com/grilling/grilling-central-frozen-treats/photos/how-to-make-a-show-stopping-ice-cream-cake' };
const PREPPY_ICC = { title: 'Preppy Kitchen: Ice Cream Cake', url: 'https://preppykitchen.com/ice-cream-cake/' };

export type CheesecakeStyle = 'baked' | 'no-bake' | 'basque';

export function processTasks(p: Project): ProcessTask[] {
  if (p.dessertType === 'cheesecake') {
    const style = p.variant ?? 'baked';
    if (style === 'no-bake') {
      return [{ offset: -1, text: 'Chill the filling until set, about 6 hours', source: RTE_NOBAKE }];
    }
    if (style === 'basque') {
      return [{ offset: -1, text: 'Cool, then chill before serving', source: PREPPY_GUIDE }];
    }
    return [
      { offset: -1, text: 'Cool in the turned-off oven with the door cracked, about 1 hour', source: SALLY_CRACKS },
      { offset: -1, text: 'Cool to room temperature, then chill at least 4 hours, ideally overnight', source: SALLY_CLASSIC },
    ];
  }
  if (p.dessertType === 'ice-cream-cake') {
    return [
      { offset: -1, text: 'Freeze 15–30 minutes between each layer', source: SALLY_5LAYER },
      { offset: -1, text: 'Freeze the finished cake at least 12 hours', source: SALLY_ICC },
      { offset: 0, text: 'Take it out about 10 minutes before serving', source: FOODNETWORK_ICC },
    ];
  }
  return [];
}

export function processTips(p: Project): ProcessTip[] {
  if (p.dessertType === 'cheesecake') {
    const style = p.variant ?? 'baked';
    if (style === 'no-bake') {
      return [
        { text: 'No-bake filling has no eggs, so it needs gelatin (or the right cream cheese to whipped cream ratio) to slice cleanly.', source: RTE_NOBAKE },
        { text: 'Best eaten within about 36 hours; baked keeps better if you need to make it further ahead.', source: FOODREPUBLIC },
      ];
    }
    if (style === 'basque') {
      return [
        { text: 'No crust. Bake very hot (450–475°F) until the top is deep brown. Cracks are expected.', source: PREPPY_GUIDE },
      ];
    }
    return [
      { text: 'Use room-temperature cream cheese so the batter stays smooth.', source: SALLY_CRACKS },
      { text: 'Bake in a water bath, with the pan wrapped in foil. Don’t open the oven door.', source: SALLY_CRACKS },
      { text: 'It’s done when a 2–3 inch spot in the center still wobbles. Overbaking is the most common cause of cracks.', source: SALLY_CRACKS },
    ];
  }
  if (p.dessertType === 'ice-cream-cake') {
    return [
      { text: 'An oil-based chiffon layer stays softer frozen than a butter cake.', source: ATK },
      { text: 'Soften ice cream about 10 minutes, until it spreads like soft-serve, and build every layer on a frozen base.', source: SALLY_ICC },
      { text: 'A fudge layer glues the cake and ice cream together; without it, layers can separate.', source: PREPPY_ICC },
      { text: 'Freeze the serving plate 30 minutes before frosting. Slice with a knife run under hot water.', source: SALLY_ICC },
    ];
  }
  return [];
}

export function assemblyText(p: Project): string {
  if (p.dessertType === 'cheesecake') return 'Add the topping and serve chilled';
  if (p.dessertType === 'ice-cream-cake') return 'Slice with a knife run under hot water';
  if (p.dessertType === 'tart') return 'Add the topping just before serving';
  return 'Assemble and chill';
}

/** Rules added to the Claude prompt so generated recipes account for them. */
export function promptRules(p: Project): string[] {
  return processTips(p).map((t) => t.text);
}

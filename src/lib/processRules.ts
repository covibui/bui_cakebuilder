import type { Project } from './types';
import { cakeStyle, styleOf, tartStyle } from './styles';

/**
 * Process rules for desserts that don't behave like sponge cakes.
 * From the cheesecake / ice cream cake research pass and the pies, tarts & other cakes pass (2026-11-27).
 * Every rule cites its source.
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

// Pies, tarts & other cakes research
const LOVEOLIVE_ENTREMET = { title: 'Love and Olive Oil: Mirror Glaze Ornament Cakes', url: 'https://www.loveandoliveoil.com/2019/12/mirror-glaze-christmas-ornament-cakes.html' };
const SUGARGEEK_ENTREMET = { title: 'Sugar Geek Show: Chocolate Entremet Cake', url: 'https://sugargeekshow.com/wprm_print/chocolate-entremet-cake' };
const SUGARGEEK_MANGO = { title: 'Sugar Geek Show: Mango Mousse Cake', url: 'https://sugargeekshow.com/mango-mousse-cake/' };
const CHEFISO = { title: 'Chef Iso: Milk Peach Entremet', url: 'https://chefiso.com/p/milk-peach-entremet/' };
const LORANN = { title: 'LorAnn: How to Make a Show-Stopping Entremet', url: 'https://blog.lorannoils.com/2023/04/18/how-to-make-a-show-stopping-entremet/' };
const HTH_CUPCAKES = { title: 'Handle the Heat: How to Convert Cake into Cupcakes', url: 'https://handletheheat.com/how-to-convert-cake-into-cupcakes/comment-page-1/' };
const SALLY_CUPCAKES = { title: "Sally's Baking Addiction: Confetti Sprinkle Cupcakes", url: 'https://sallysbakingaddiction.com/soft-fluffy-funfetti-cupcakes/' };
const KA_CUPCAKES = { title: 'King Arthur: How to Convert Cake to Cupcakes', url: 'https://www.kingarthurbaking.com/blog/2019/04/25/how-to-convert-cake-to-cupcakes?page=2' };
const FN_BUNDT = { title: 'Food Network: Everything About Bundt Cakes', url: 'https://www.foodnetwork.com/recipes/packages/baking-guide/everything-you-need-to-know-about-bundt-cakes' };
const TOH_BUNDT = { title: 'Taste of Home: How to Get a Cake Out of a Bundt Pan', url: 'https://readersdigest.ca/food/cooking-tips/how-to-get-a-cake-out-of-a-bundt-pan' };
const KA_BUNDT = { title: 'King Arthur: Stuck Bundt', url: 'https://www.kingarthurbaking.com/blog/2017/10/10/stuck-bundt' };
const NORDICWARE = { title: 'Nordic Ware: How to Make a Bundt Cake', url: 'https://www.nordicware.com/?p=3427278' };
const SALLY_ANGEL = { title: "Sally's Baking Addiction: Angel Food Cake", url: 'https://sallysbakingaddiction.com/angel-food-cake/comment-page-17/' };
const SALLY_CHIFFON = { title: "Sally's Baking Addiction: Classic Chiffon Cake", url: 'https://sallysbakingaddiction.com/chiffon-cake/' };
const BEB_ANGEL = { title: 'Brown Eyed Baker: Angel Food Cake', url: 'https://www.browneyedbaker.com/angel-food-cake/comment-page-2/' };
const SALLY_ROLL = { title: "Sally's Baking Addiction: Chocolate Cake Roll", url: 'https://sallysbakingaddiction.com/chocolate-cake-roll/' };
const KA_ROLL = { title: 'King Arthur: My Quest for a Perfect Bûche de Noël', url: 'https://kingarthurbaking.com/comment/571216' };
const BLAC_ROLL = { title: 'Baking Like a Chef: How to Roll a Cake Without Cracking', url: 'https://www.bakinglikeachef.com/how-to-make-roll-cake/' };
const SKILLSHARE_ROLL = { title: 'Skillshare: Easy Roulade Cake Guide', url: 'https://www.skillshare.com/blog/easy-roulade-cake-guide-and-recipe/' };
const SUGARGEEK_TART = { title: 'Sugar Geek Show: Pâte Sucrée Tart Dough', url: 'https://sugargeekshow.com/pate-sucree-tart-dough-recipe/' };
const ATK_TART = { title: "America's Test Kitchen: Pâte Sucrée Tart Shell", url: 'https://www.americastestkitchen.com/recipes/14588-pate-sucree-tart-shell' };
const OUAC_TART = { title: 'Once Upon a Chef: Pâte Sucrée', url: 'https://www.onceuponachef.com/recipes/pate-sucree-sweet-tart-dough.html/comment-page-1' };
const MC_TART = { title: 'MasterClass: Tart Recipes', url: 'https://www.masterclass.com/articles/tart-recipes' };
const CKBK_TART = { title: 'Professional Baking: Baked Tarts', url: 'https://app.ckbk.com/section/prof83497c15s001ss002/baked-tarts' };

export function processTasks(p: Project): ProcessTask[] {
  if (p.dessertType === 'cheesecake') {
    const style = styleOf(p);
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
  const cake = cakeStyle(p);
  if (cake === 'entremet') {
    return [
      { offset: -3, text: 'Freeze the insert overnight', source: LOVEOLIVE_ENTREMET },
      { offset: -2, text: 'Assemble in the ring or mold and freeze overnight', source: SUGARGEEK_ENTREMET },
      { offset: -1, text: 'Pour the mirror glaze at about 90–94°F over the frozen cake', source: CHEFISO },
    ];
  }
  if (cake === 'roll') {
    return [
      { offset: -1, text: 'Turn the warm sponge onto a sugared towel, roll it up and let it cool rolled', source: KA_ROLL },
      { offset: -1, text: 'Unroll, fill, re-roll, then chill before slicing', source: BLAC_ROLL },
    ];
  }
  if (cake === 'bundt') {
    return [{ offset: -1, text: 'Cool about 10 minutes in the pan, then turn out', source: KA_BUNDT }];
  }
  if (cake === 'chiffon' || cake === 'angel-food') {
    return [{ offset: -1, text: 'Cool upside down in the pan until completely cool', source: SALLY_CHIFFON }];
  }
  const tart = tartStyle(p);
  if (tart) {
    return [{ offset: -1, text: 'Freeze the shell 20–30 minutes before baking so it doesn’t shrink', source: SUGARGEEK_TART }];
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
    const style = styleOf(p);
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
  const cake = cakeStyle(p);
  if (cake === 'entremet') {
    return [
      { text: 'Plan at least 2 days: make and freeze the parts first, then assemble and glaze.', source: SUGARGEEK_MANGO },
      { text: 'Silicone molds give the smooth surface a mirror glaze needs.', source: LORANN },
    ];
  }
  if (cake === 'cupcake') {
    return [
      { text: 'Fill liners about 2/3 full; some chocolate batters only halfway.', source: SALLY_CUPCAKES },
      { text: 'Same batter and temperature as the cake. Standard cupcakes bake 18–22 minutes at 350°F.', source: HTH_CUPCAKES },
      { text: 'Sponge batters bake up dry and short as cupcakes unless soaked; butter cakes work best.', source: KA_CUPCAKES },
    ];
  }
  if (cake === 'bundt') {
    return [
      { text: 'Dense, tight-crumb batters like pound cake suit a Bundt pan best.', source: FN_BUNDT },
      { text: 'Grease every part of the pan, tube included, even if it’s nonstick. Use shortening, not butter.', source: TOH_BUNDT },
      { text: 'A 10–12 cup pan bakes 45–60 minutes at 325–350°F.', source: NORDICWARE },
    ];
  }
  if (cake === 'chiffon' || cake === 'angel-food') {
    return [
      { text: 'Use an ungreased tube pan, never a Bundt pan. The batter needs to cling to the sides to rise.', source: SALLY_ANGEL },
      { text: 'Cool it upside down until completely cool, or it collapses.', source: SALLY_CHIFFON },
      ...(cake === 'angel-food' ? [{ text: 'It keeps 1 day ahead, wrapped, at room temperature.', source: BEB_ANGEL }] : []),
    ];
  }
  if (cake === 'roll') {
    return [
      { text: 'It’s a thin sponge: bake only about 13–14 minutes.', source: SALLY_ROLL },
      { text: 'Roll it while it’s warm. Overbaking is the main cause of cracks.', source: SKILLSHARE_ROLL },
    ];
  }
  const tart = tartStyle(p);
  if (tart === 'set') {
    return [
      { text: 'Blind bake at 350°F about 30 minutes with weights, then about 10 minutes uncovered. Cool before filling.', source: ATK_TART },
      { text: 'Pâte sucrée stays crisp chilled, so it suits tarts kept in the fridge.', source: OUAC_TART },
      { text: 'Make each part separately and assemble at the end.', source: MC_TART },
    ];
  }
  if (tart === 'baked') {
    return [
      { text: 'The filling bakes under the fruit. Hard fruit (some apples, pears, plums) may not soften in time, so pre-cook it.', source: CKBK_TART },
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
  if (p.dessertType === 'tart') return tartStyle(p) === 'baked' ? 'Brush with glaze and serve' : 'Add the fruit and glaze just before serving';
  switch (cakeStyle(p)) {
    case 'entremet': return 'Decorate and serve';
    case 'cupcake': return 'Frost and serve';
    case 'bundt': return 'Glaze and serve';
    case 'chiffon':
    case 'angel-food': return 'Slice with a serrated knife and serve';
    case 'roll': return 'Slice and serve';
    default: return 'Assemble and chill';
  }
}

/** Rules added to the Claude prompt so generated recipes account for them. */
export function promptRules(p: Project): string[] {
  return processTips(p).map((t) => t.text);
}

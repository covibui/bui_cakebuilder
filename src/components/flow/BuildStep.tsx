'use client';

import { useState } from 'react';
import type { Bundle } from '@/lib/repo';
import { bakeTimeline, componentGaps, planComponents, shoppingList } from '@/lib/plan';
import { displayAmount } from '@/lib/units';
import { DESSERT_LABEL } from '@/lib/templates';
import { processTips } from '@/lib/processRules';
import { Button, Card, Chip, H1, H2, Note } from '@/components/ui';
import { CitationKey, CitationProvider, CitedText, CrossSection, UnitToggle, useUnitPref } from '@/components/recipe';
import { HandoffPanel, RecipeSource } from '@/components/sources';
import type { StepProps } from './ProjectFlow';

type Tab = 'recipe' | 'shop' | 'time';

export default function BuildStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const [tab, setTab] = useState<Tab>('recipe');
  const [pref, setPref] = useUnitPref();
  const plans = planComponents(p, bundle.components, bundle.recipes);
  const included = bundle.components.filter((c) => c.included).sort((a, b) => a.makeAheadDay - b.makeAheadDay);
  const gaps = componentGaps(p, bundle.components);
  const shop = shoppingList(plans);
  const days = bakeTimeline(p, bundle.components);
  const missing = included.filter((c) => !c.recipeId);
  const tips = processTips(p);
  const pans = p.size.shape === 'sheet' ? '9×13 in sheet' : p.size.tiers.map((t) => (p.size.shape === 'cupcake' ? `${t.sizeIn} cupcakes` : `${t.sizeIn} in ${p.size.shape} × ${t.layers}`)).join(' + ');

  return (
    <CitationProvider>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <H1>{p.title}</H1>
          <p className="text-neutral-600">
            {DESSERT_LABEL[p.dessertType]} for {p.request.forWho || 'someone'} · {p.request.servings ?? '?'} servings · {pans}
            {p.request.date && ` · ${p.request.date}`}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
          <aside className="flex flex-col gap-3">
            <CrossSection components={bundle.components} size={p.size} />
            <Button onClick={() => go('comp')}>Edit what’s inside</Button>
            <Button onClick={() => go('size')}>Edit size</Button>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" role="tablist">
                {([['recipe', 'Written recipe'], ['shop', 'Shopping list'], ['time', 'Bake timeline']] as [Tab, string][]).map(([t, l]) => (
                  <Chip key={t} role="tab" aria-selected={tab === t} on={tab === t} onClick={() => setTab(t)}>{l}</Chip>
                ))}
              </div>
              <UnitToggle pref={pref} setPref={setPref} />
            </div>

            {gaps.map((g) => <Note key={g} tone="warn">{g}</Note>)}
            {tips.length > 0 && (
              <Card>
                <H2>Before you start</H2>
                <ul className="mt-1 flex flex-col gap-1">
                  {tips.map((t) => (
                    <li key={t.text}>
                      {t.text} <a className="text-sm underline" href={t.source.url} target="_blank" rel="noreferrer">✓ source</a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {plans.flatMap((x) => x.warnings).map((w) => <Note key={w} tone="warn">{w}</Note>)}

            {tab === 'recipe' && (
              <div className="flex flex-col gap-4">
                {missing.length > 0 && <HandoffPanel bundle={bundle} />}
                <CitationKey />
                {included.map((c) => {
                  const plan = plans.find((x) => x.component.id === c.id);
                  return (
                    <Card key={c.id} className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <H2>{c.name}</H2>
                        <span className="text-sm text-neutral-600">{days.find((d) => d.offset === c.makeAheadDay)?.label}</span>
                      </div>
                      {plan ? (
                        <>
                          <ul className="grid gap-x-6 sm:grid-cols-2">
                            {plan.ingredients.map((i) => (
                              <li key={i.name} className="flex justify-between gap-3 border-b border-neutral-200 py-1">
                                <span>{i.name}</span>
                                <span className="font-semibold">{displayAmount(i, i.scaled, pref)}</span>
                              </li>
                            ))}
                          </ul>
                          <ol className="list-decimal pl-5">
                            {plan.recipe.steps.map((s, k) => (
                              <li key={k} className="py-1"><CitedText text={s.text} recipeId={plan.recipe.id} citations={bundle.citations} /></li>
                            ))}
                          </ol>
                        </>
                      ) : (
                        <RecipeSource component={c} />
                      )}
                    </Card>
                  );
                })}
                {missing.length === 0 && included.length > 0 && <HandoffPanel bundle={bundle} />}
              </div>
            )}

            {tab === 'shop' && (
              <Card>
                {shop.length === 0 ? (
                  <p className="text-neutral-600">Add recipes to build the shopping list.</p>
                ) : (
                  <ul>
                    {shop.map((i) => (
                      <li key={`${i.name}|${i.unit}`} className="flex flex-wrap justify-between gap-3 border-b border-neutral-200 py-2">
                        <span>
                          <b>{i.name}</b>
                          <span className="block text-sm text-neutral-600">{i.usedBy.join(', ')}</span>
                        </span>
                        <span className="font-semibold">{displayAmount({ name: i.name, amount: i.total, unit: i.unit, needsScale: i.needsScale }, i.total, pref)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {tab === 'time' && (
              <ol className="flex flex-col gap-3">
                {days.map((d) => (
                  <li key={d.offset}>
                    <Card>
                      <H2>{d.label}</H2>
                      <ul className="mt-1 list-disc pl-5">
                        {d.tasks.map((t) => (
                          <li key={t.text}>
                            {t.text}
                            {t.sourceUrl && <> <a className="text-sm underline" href={t.sourceUrl} target="_blank" rel="noreferrer">✓ source</a></>}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </li>
                ))}
              </ol>
            )}

            <div><Button primary onClick={() => go('cook')} disabled={plans.length === 0}>Start baking</Button></div>
          </div>
        </div>
      </section>
    </CitationProvider>
  );
}

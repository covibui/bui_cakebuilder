'use client';

import type { Bundle } from '@/lib/repo';
import { db } from '@/lib/db';
import { deriveTitle, saveProject, useFlavors } from '@/lib/repo';
import type { BuildMode, CakeStyle, DessertType, Project, Variant } from '@/lib/types';
import { STYLES, defaultSize, styleOf } from '@/lib/styles';
import { DESSERT_LABEL } from '@/lib/templates';
import { Button, Card, Chip, FieldLabel, H1, H2, Segmented } from '@/components/ui';
import type { StepProps } from './ProjectFlow';

// Round 8 fix: each option says what happens next, so the build doesn't feel like the request again.
const MODES: { mode: BuildMode; title: string; text: string; then: string; tape: 'rose' | 'pistachio' | 'latte' }[] = [
  { mode: 'know', title: 'I know what I want', text: 'Pick the flavors yourself.', then: 'Next: the app suggests what goes inside.', tape: 'rose' },
  { mode: 'inspire', title: 'Inspire me', text: 'Ideas from their words and popular pairings.', then: 'Next: pick one of the flavor ideas.', tape: 'pistachio' },
  { mode: 'blank', title: 'Blank builder', text: 'Start empty and add every part yourself.', then: 'Next: the empty cake, ready for layers.', tape: 'latte' },
];

export default function ForkStep({ bundle, go }: { bundle: Bundle } & StepProps) {
  const p = bundle.project;
  const flavors = useFlavors() ?? [];

  const withPan = (next: Project): Project =>
    next.dessertType === 'cake' ? { ...next, size: { ...next.size, ...defaultSize(styleOf(next) as CakeStyle, next.request.servings) } } : next;

  const setType = (dessertType: DessertType) => {
    const next = withPan({ ...p, dessertType, variant: undefined });
    return saveProject({ ...next, title: p.titleIsCustom ? p.title : deriveTitle(next, flavors) });
  };

  const setStyle = (variant: Variant) => {
    const next = withPan({ ...p, variant });
    return saveProject({ ...next, title: p.titleIsCustom ? p.title : deriveTitle(next, flavors) });
  };
  const styles = STYLES[p.dessertType];

  const pick = async (buildMode: BuildMode) => {
    await saveProject({ ...p, buildMode });
    if (buildMode === 'blank') {
      await db().components.where('projectId').equals(p.id).delete();
      go('comp');
    } else go('flavor');
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <H1>How do you want to build?</H1>
        <p className="text-espresso-muted">Their request is saved. Now it&apos;s your plan.</p>
      </div>
      <Card label="What you're making" className="flex flex-col gap-4">
        <Segmented
          label="Dessert"
          value={p.dessertType}
          options={(Object.keys(DESSERT_LABEL) as DessertType[]).map((t) => [t, DESSERT_LABEL[t]])}
          onChange={setType}
        />
        {styles && (
          <div className="flex flex-col gap-2">
            <FieldLabel>Style</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {styles.map(([v, l]) => (
                <Chip key={v} on={styleOf(p) === v} onClick={() => setStyle(v)}>{l}</Chip>
              ))}
            </div>
          </div>
        )}
      </Card>
      <div className="grid gap-6 pt-2 sm:grid-cols-3">
        {MODES.map((m, i) => (
          <Card key={m.mode} tape={m.tape} selected={p.buildMode === m.mode} className="flex h-full flex-col gap-2">
            <H2>{m.title}</H2>
            <p className="text-sm">{m.text}</p>
            <p className="text-xs text-espresso-muted">{m.then}</p>
            <div className="mt-auto pt-2">
              <Button primary={i === 0} small onClick={() => pick(m.mode)}>Start</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

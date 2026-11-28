'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useProject } from '@/lib/repo';
import RequestStep from './RequestStep';
import ForkStep from './ForkStep';
import FlavorStep from './FlavorStep';
import ComponentsStep from './ComponentsStep';
import SizeStep from './SizeStep';
import BuildStep from './BuildStep';
import CookStep from './CookStep';
import LogStep from './LogStep';
import { AppBar, Button, ButtonLink, Card, H2, NextRow, Page, StepTabs } from '@/components/ui';

export type Step = 'request' | 'fork' | 'flavor' | 'comp' | 'size' | 'build' | 'cook' | 'log' | 'done';

const WIZARD: [Step, string][] = [
  ['request', 'Request'],
  ['fork', 'How to build'],
  ['flavor', 'Flavors'],
  ['comp', 'Inside'],
  ['size', 'Size & servings'],
  ['build', 'Your build'],
];

export interface StepProps {
  go: (s: Step) => void;
}

export default function ProjectFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const step = (params.get('step') as Step) || 'request';
  const bundle = useProject(id);
  const [summary, setSummary] = useState<string[]>([]);

  const go = (s: Step) => {
    router.push(`/project?id=${id}&step=${s}`);
    window.scrollTo(0, 0);
  };

  if (bundle === undefined) return null;
  if (bundle === null) {
    return (
      <>
        <AppBar />
        <Page>
          <Card label="Not found">
            <p>That cake isn&apos;t on this device.</p>
            <div className="mt-3"><ButtonLink href="/" primary>Back to your cakes</ButtonLink></div>
          </Card>
        </Page>
      </>
    );
  }

  const ci = WIZARD.findIndex(([s]) => s === step);

  return (
    <>
      <AppBar title={bundle.project.title} saved>
        <ButtonLink href="/" small>Your cakes</ButtonLink>
      </AppBar>
      <Page>
        {ci >= 0 && <StepTabs steps={WIZARD} current={ci} onGo={go} />}

        {step === 'request' && <RequestStep bundle={bundle} go={go} />}
        {step === 'fork' && <ForkStep bundle={bundle} go={go} />}
        {step === 'flavor' && <FlavorStep bundle={bundle} go={go} />}
        {step === 'comp' && <ComponentsStep bundle={bundle} go={go} />}
        {step === 'size' && <SizeStep bundle={bundle} go={go} />}
        {step === 'build' && <BuildStep bundle={bundle} go={go} />}
        {step === 'cook' && <CookStep bundle={bundle} go={go} />}
        {step === 'log' && <LogStep bundle={bundle} go={go} onSaved={setSummary} />}
        {step === 'done' && (
          <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <Card tape="pistachio" label="Logged">
              <p className="font-display text-[33px] font-medium leading-[45px] tracking-[-.16px]">Next time starts smarter.</p>
              <H2 className="mt-4">What changed in your recipes</H2>
              {summary.length ? (
                <ul className="mt-1 list-disc pl-6">{summary.map((s) => <li key={s}>{s}</li>)}</ul>
              ) : (
                <p className="text-espresso-muted">No changes recorded this time.</p>
              )}
              <NextRow hint="Your notes now lead the next bake.">
                <Button onClick={() => go('build')}>See the updated recipe</Button>
                <ButtonLink href="/" primary>Back to your cakes</ButtonLink>
              </NextRow>
            </Card>
          </section>
        )}
      </Page>
    </>
  );
}

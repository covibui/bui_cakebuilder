'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, H1 } from '@/components/ui';
import { createProject, useProjects } from '@/lib/repo';
import { DESSERT_LABEL } from '@/lib/templates';

const STATUS = { planning: 'Planning', baking: 'Baking', baked: 'Baked' } as const;

export default function Home() {
  const router = useRouter();
  const projects = useProjects();

  const start = async () => {
    const id = await createProject();
    router.push(`/project?id=${id}&step=request`);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <H1>Your cakes</H1>
        <div className="flex gap-2">
          <Link href="/logs" className="flex min-h-11 items-center rounded-lg border-2 border-neutral-800 px-4 font-semibold">
            Bake log
          </Link>
          <Button primary onClick={start}>+ New cake</Button>
        </div>
      </header>

      {projects === undefined ? null : projects.length === 0 ? (
        <Card>
          <p className="font-semibold">No cakes yet.</p>
          <p className="text-neutral-600">Start with who it&apos;s for and what they asked for.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              {/* A saved cake leads back to its build (I23). */}
              <Link href={`/project?id=${p.id}&step=${p.status === 'planning' && p.title.startsWith('New') ? 'request' : 'build'}`} className="block h-full">
                <Card className="h-full hover:border-neutral-800">
                  <p className="text-sm text-neutral-600">{DESSERT_LABEL[p.dessertType]} · {STATUS[p.status]}</p>
                  <p className="mt-1 text-lg font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {[p.request.forWho, p.request.occasion, p.request.date].filter(Boolean).join(' · ') || 'No request yet'}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

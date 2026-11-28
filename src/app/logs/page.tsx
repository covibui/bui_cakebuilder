'use client';

import Link from 'next/link';
import { Card, H1 } from '@/components/ui';
import { useBakeLogs, useProjects } from '@/lib/repo';

export default function LogsPage() {
  const logs = useBakeLogs();
  const projects = useProjects() ?? [];
  const title = (id: string) => projects.find((p) => p.id === id)?.title ?? 'Deleted cake';

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Link href="/" className="font-semibold underline">← Your cakes</Link>
      <H1>Bake log</H1>
      {logs?.length === 0 && <p className="text-neutral-600">No bakes logged yet.</p>}
      <ul className="flex flex-col gap-3">
        {logs?.map((l) => (
          <li key={l.id}>
            <Link href={`/project?id=${l.projectId}&step=build`}>
              <Card className="hover:border-neutral-800">
                <p className="text-sm text-neutral-600">{l.bakedOn}</p>
                <p className="text-lg font-semibold">{title(l.projectId)}</p>
                <p className="text-sm">{l.results.filter((r) => r.verdict === 'change').length} changes · {l.measured.filter((m) => m.value).length} guesses tested</p>
                {l.notes && <p className="mt-1 text-neutral-700">{l.notes}</p>}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

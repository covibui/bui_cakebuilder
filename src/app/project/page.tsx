import { Suspense } from 'react';
import ProjectFlow from '@/components/flow/ProjectFlow';

// One static route (?id=&step=) so the page can be cached for offline use.
export default function ProjectPage() {
  return (
    <Suspense fallback={null}>
      <ProjectFlow />
    </Suspense>
  );
}

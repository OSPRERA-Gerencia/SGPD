import { ProjectsRepository } from '@/lib/repositories/ProjectsRepository';
import { PriorityWeightsRepository } from '@/lib/repositories/PriorityWeightsRepository';
import { ProjectsDashboard } from './_components/ProjectsDashboard';

export const revalidate = 0;

export default async function ProjectsPage(): Promise<JSX.Element> {
  const [projects, weights] = await Promise.all([
    ProjectsRepository.listProjects({
      sortField: 'score_weighted',
      sortDirection: 'desc',
    }),
    PriorityWeightsRepository.getActiveWeights(),
  ]);

  return (
    <div className="px-4 py-8 lg:px-8">
      <ProjectsDashboard initialProjects={projects} initialWeights={weights} />
    </div>
  );
}


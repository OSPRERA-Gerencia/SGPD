import { getSprintDetailForServer, getSprintSummaries } from './actions';
import { SprintsDashboard } from './_components/SprintsDashboard';

export const revalidate = 0;

export default async function SprintsPage(): Promise<JSX.Element> {
  const summaries = await getSprintSummaries();
  const initialDetail =
    summaries.length > 0 ? await getSprintDetailForServer(summaries[0].sprint.id) : null;

  return (
    <div className="px-4 py-8 lg:px-8">
      <SprintsDashboard initialSummaries={summaries} initialDetail={initialDetail} />
    </div>
  );
}


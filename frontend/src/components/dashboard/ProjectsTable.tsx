import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ProjectStatusItem } from '@/services/dashboard.service';

interface Props {
  data?: ProjectStatusItem[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PLANNING: { label: 'Planning', className: 'bg-primary/10 text-primary' },
  IN_PROGRESS: { label: 'Active', className: 'bg-primary/20 text-primary' },
  ON_HOLD: { label: 'On Hold', className: 'bg-surface-hover text-text-tertiary' },
  COMPLETED: { label: 'Done', className: 'bg-primary/10 text-primary' },
};

export function ProjectsTable({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
        <p className="text-body-sm">No projects</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left py-2.5 px-4 text-caption text-text-tertiary font-medium">Project</th>
            <th className="text-left py-2.5 px-4 text-caption text-text-tertiary font-medium">Status</th>
            <th className="text-left py-2.5 px-4 text-caption text-text-tertiary font-medium">Rooms</th>
            <th className="text-left py-2.5 px-4 text-caption text-text-tertiary font-medium">Assets</th>
            <th className="text-right py-2.5 px-4 text-caption text-text-tertiary font-medium">Issues</th>
            <th className="text-right py-2.5 px-4 text-caption text-text-tertiary font-medium">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {data.map((project) => {
            const status = STATUS_CONFIG[project.status] || { label: project.status, className: 'bg-surface-hover text-text-secondary' };
            const roomPct = project.roomsTotal > 0 ? Math.round((project.roomsCompleted / project.roomsTotal) * 100) : 0;
            const assetPct = project.assetsTotal > 0 ? Math.round((project.assetsVerified / project.assetsTotal) * 100) : 0;

            return (
              <tr key={project.id} className="hover:bg-surface-hover/50 transition-colors">
                <td className="py-2.5 px-4">
                  <Link to={`/projects/${project.id}`} className="text-text-primary hover:text-primary transition-colors font-medium">
                    {project.name}
                  </Link>
                </td>
                <td className="py-2.5 px-4">
                  <span className={cn('text-caption px-2 py-0.5 rounded-full', status.className)}>
                    {status.label}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="group/room relative flex items-center gap-2 cursor-default">
                    <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full group-hover/room:brightness-125 transition-all" style={{ width: `${roomPct}%` }} />
                    </div>
                    <span className="text-caption text-text-tertiary">{project.roomsCompleted}/{project.roomsTotal}</span>
                    <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/room:block z-10 pointer-events-none">
                      <div className="bg-[#1c2128] border border-surface-border rounded-md px-2 py-1 text-caption text-text-primary whitespace-nowrap shadow-lg">
                        {roomPct}% completed &middot; {project.roomsInProgress} in progress &middot; {project.roomsBlocked} blocked
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="group/asset relative flex items-center gap-2 cursor-default">
                    <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full group-hover/asset:brightness-125 transition-all" style={{ width: `${assetPct}%` }} />
                    </div>
                    <span className="text-caption text-text-tertiary">{project.assetsVerified}/{project.assetsTotal}</span>
                    <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/asset:block z-10 pointer-events-none">
                      <div className="bg-[#1c2128] border border-surface-border rounded-md px-2 py-1 text-caption text-text-primary whitespace-nowrap shadow-lg">
                        {assetPct}% verified &middot; {project.assetsTotal - project.assetsVerified} pending
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="group/iss relative inline-block cursor-default">
                    {project.issuesOpen > 0 ? (
                      <span className="text-caption text-error font-medium">{project.issuesOpen}</span>
                    ) : (
                      <span className="text-caption text-text-tertiary">0</span>
                    )}
                    <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/iss:block z-10 pointer-events-none">
                      <div className="bg-[#1c2128] border border-surface-border rounded-md px-2 py-1 text-caption text-text-primary whitespace-nowrap shadow-lg">
                        {project.issuesOpen} open / {project.issuesTotal} total
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span className="text-caption text-text-secondary font-medium">
                    {project.overallProgress}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, ChevronDown, ChevronRight, FolderKanban, Layers } from 'lucide-react';
import { Card, CardContent, Input, Badge } from '@/components/ui';
import { buildingService, type Building } from '@/services/building.service';
import { cn } from '@/lib/utils';

interface BuildingWithProject extends Building {
  project?: {
    id: string;
    name: string;
    clientName?: string;
  };
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  clientName: string;
  buildings: BuildingWithProject[];
}

export function BuildingsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Fetch all buildings
  const { data: allBuildings = [], isLoading } = useQuery({
    queryKey: ['all-buildings'],
    queryFn: () => buildingService.getAll(),
  });

  // Filter buildings by search
  const filteredBuildings = allBuildings.filter((building: BuildingWithProject) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      building.name.toLowerCase().includes(searchLower) ||
      (building.description || '').toLowerCase().includes(searchLower) ||
      (building.project?.name || '').toLowerCase().includes(searchLower)
    );
  });

  // Group buildings by project
  const projectGroups = useMemo(() => {
    const groups: Map<string, ProjectGroup> = new Map();

    filteredBuildings.forEach((building: BuildingWithProject) => {
      const projectId = building.project?.id || building.projectId || 'unknown';
      const projectName = building.project?.name || 'Unknown Project';
      const clientName = building.project?.clientName || '';

      if (!groups.has(projectId)) {
        groups.set(projectId, {
          projectId,
          projectName,
          clientName,
          buildings: [],
        });
      }
      groups.get(projectId)!.buildings.push(building);
    });

    // Sort buildings within each group by name
    groups.forEach((group) => {
      group.buildings.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Convert to array and sort by project name
    return Array.from(groups.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName)
    );
  }, [filteredBuildings]);

  // Initialize first project as expanded on first load
  useState(() => {
    if (projectGroups.length > 0 && expandedProjects.size === 0) {
      setExpandedProjects(new Set([projectGroups[0].projectId]));
    }
  });

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      // If already expanded, just close it
      if (prev.has(projectId)) {
        return new Set();
      }
      // Otherwise, close all and open only this one (accordion behavior)
      return new Set([projectId]);
    });
  };

  const expandAll = () => {
    setExpandedProjects(new Set(projectGroups.map(g => g.projectId)));
  };

  const collapseAll = () => {
    setExpandedProjects(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Buildings</h1>
          <p className="text-body text-text-secondary">
            {allBuildings.length} buildings across {projectGroups.length} projects
          </p>
        </div>
        {projectGroups.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-body-sm text-text-secondary hover:text-primary transition-colors"
            >
              Expand All
            </button>
            <span className="text-text-tertiary">|</span>
            <button
              onClick={collapseAll}
              className="text-body-sm text-text-secondary hover:text-primary transition-colors"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search buildings, projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* Buildings by Project */}
      {projectGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No buildings found</h3>
            <p className="text-body text-text-secondary">
              {search ? 'Try a different search term' : 'Create a project and add buildings to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectGroups.map((group) => {
            const isExpanded = expandedProjects.has(group.projectId);
            const totalFloors = group.buildings.reduce((sum, b) => sum + (b._count?.floors || 0), 0);

            return (
              <Card key={group.projectId} className="overflow-hidden">
                {/* Project Header */}
                <button
                  onClick={() => toggleProject(group.projectId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-text-primary">{group.projectName}</h3>
                      {group.clientName && (
                        <p className="text-body-sm text-text-secondary">{group.clientName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-body-sm text-text-primary">{group.buildings.length} buildings</p>
                      <p className="text-caption text-text-tertiary">{totalFloors} floors</p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-text-tertiary" />
                    ) : (
                      <ChevronRight size={20} className="text-text-tertiary" />
                    )}
                  </div>
                </button>

                {/* Buildings List */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="border-t border-surface-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {group.buildings.map((building) => (
                        <div
                          key={building.id}
                          onClick={() => navigate(`/buildings/${building.id}`)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-surface-border hover:border-primary/50 hover:bg-surface-hover cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                            <Building2 size={20} className="text-info" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body font-medium text-text-primary truncate">
                              {building.name}
                            </h4>
                            <div className="flex items-center gap-2 text-caption text-text-secondary">
                              <Layers size={12} />
                              <span>{building._count?.floors || 0} floors</span>
                              {building.floorplanUrl && (
                                <Badge variant="success" size="sm" className="ml-auto">
                                  Plan
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

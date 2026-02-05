import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DoorOpen, ChevronDown, ChevronRight, FolderKanban, Layers, Building2 } from 'lucide-react';
import { Card, CardContent, Badge, getRoomTypeIcon } from '@/components/ui';
import { useSearchStore } from '@/stores/search.store';
import { roomService, type Room } from '@/services/room.service';
import { cn } from '@/lib/utils';

interface RoomWithHierarchy extends Room {
  floor?: {
    id: string;
    name: string;
    level: number;
    building?: {
      id: string;
      name: string;
      project?: {
        id: string;
        name: string;
        clientName?: string;
      };
    };
  };
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  clientName: string;
  rooms: RoomWithHierarchy[];
}

const statusLabels: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
};

export function RoomsPage() {
  const navigate = useNavigate();
  const { query: search } = useSearchStore();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Fetch all rooms directly
  const { data: allRooms = [], isLoading } = useQuery({
    queryKey: ['all-rooms'],
    queryFn: () => roomService.getAll(),
  });

  // Filter rooms by search
  const filteredRooms = allRooms.filter((room: RoomWithHierarchy) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      room.name.toLowerCase().includes(searchLower) ||
      (room.type || '').toLowerCase().includes(searchLower) ||
      (room.floor?.name || '').toLowerCase().includes(searchLower) ||
      (room.floor?.building?.name || '').toLowerCase().includes(searchLower) ||
      (room.floor?.building?.project?.name || '').toLowerCase().includes(searchLower) ||
      (room.floor?.building?.project?.clientName || '').toLowerCase().includes(searchLower)
    );
  });

  // Group rooms by project
  const projectGroups = useMemo(() => {
    const groups: Map<string, ProjectGroup> = new Map();

    filteredRooms.forEach((room: RoomWithHierarchy) => {
      const projectId = room.floor?.building?.project?.id || 'unknown';
      const projectName = room.floor?.building?.project?.name || 'Unknown Project';
      const clientName = room.floor?.building?.project?.clientName || '';

      if (!groups.has(projectId)) {
        groups.set(projectId, {
          projectId,
          projectName,
          clientName,
          rooms: [],
        });
      }
      groups.get(projectId)!.rooms.push(room);
    });

    // Sort rooms within each group by building, floor level, then room name
    groups.forEach((group) => {
      group.rooms.sort((a, b) => {
        const buildingCompare = (a.floor?.building?.name || '').localeCompare(b.floor?.building?.name || '');
        if (buildingCompare !== 0) return buildingCompare;
        const levelCompare = (a.floor?.level || 0) - (b.floor?.level || 0);
        if (levelCompare !== 0) return levelCompare;
        return a.name.localeCompare(b.name);
      });
    });

    // Convert to array and sort by project name
    return Array.from(groups.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName)
    );
  }, [filteredRooms]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      if (prev.has(projectId)) {
        return new Set();
      }
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
          <h1 className="text-h1">Rooms</h1>
          <p className="text-body text-text-secondary">
            {allRooms.length} rooms across {projectGroups.length} projects
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

      {/* Rooms by Project */}
      {projectGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No rooms found</h3>
            <p className="text-body text-text-secondary">
              {search ? 'Try a different search term' : 'Create a project and add rooms to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectGroups.map((group) => {
            const isExpanded = expandedProjects.has(group.projectId);
            const totalAssets = group.rooms.reduce((sum, r) => sum + (r._count?.assets || 0), 0);

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
                      <p className="text-body-sm text-text-primary">{group.rooms.length} rooms</p>
                      <p className="text-caption text-text-tertiary">{totalAssets} assets</p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-text-tertiary" />
                    ) : (
                      <ChevronRight size={20} className="text-text-tertiary" />
                    )}
                  </div>
                </button>

                {/* Rooms List */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="border-t border-surface-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {group.rooms.map((room) => {
                        const RoomTypeIconComponent = getRoomTypeIcon(room.roomTypeIcon);
                        return (
                        <div
                          key={room.id}
                          onClick={() => navigate(`/rooms/${room.id}`)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-surface-border hover:border-primary/50 hover:bg-surface-hover cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                            {RoomTypeIconComponent ? (
                              <RoomTypeIconComponent size={20} className="text-primary" />
                            ) : (
                              <DoorOpen size={20} className="text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body font-medium text-text-primary truncate">
                              {room.name}
                            </h4>
                            <div className="flex items-center gap-2 text-caption text-text-secondary">
                              <Building2 size={12} />
                              <span className="truncate">{room.floor?.building?.name}</span>
                              <span className="text-text-tertiary">·</span>
                              <Layers size={12} />
                              <span>{room.floor?.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  room.status === 'COMPLETED' ? 'success' :
                                  room.status === 'IN_PROGRESS' ? 'primary' :
                                  room.status === 'BLOCKED' ? 'error' :
                                  'secondary'
                                }
                                size="sm"
                              >
                                {statusLabels[room.status]}
                              </Badge>
                              {(room._count?.assets || 0) > 0 && (
                                <span className="text-caption text-text-tertiary">
                                  {room._count?.assets} assets
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                      })}
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

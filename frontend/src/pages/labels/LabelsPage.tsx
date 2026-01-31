import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tags, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LabelGenerator } from '@/components/labels';
import { projectService } from '@/services/project.service';

export function LabelsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Fetch projects for selector
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 flex items-center gap-2">
            <Tags size={28} />
            Label Generator
          </h1>
          <p className="text-body text-text-secondary mt-1">
            Generate and print labels for cables, racks, and assets
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={18} />
            Select Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="input-base w-full md:w-64"
          >
            <option value="">No project (generic labels)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProject && (
            <p className="text-body-sm text-text-tertiary mt-2">
              Labels will include project name: {selectedProject.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Label Generator */}
      <LabelGenerator projectName={selectedProject?.name} />
    </div>
  );
}

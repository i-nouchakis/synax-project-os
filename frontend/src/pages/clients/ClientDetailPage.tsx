import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  UserCircle,
  FolderKanban,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { clientService } from '@/services/client.service';

const statusVariants: Record<string, 'default' | 'primary' | 'success' | 'error'> = {
  PLANNING: 'default',
  IN_PROGRESS: 'primary',
  ON_HOLD: 'error',
  COMPLETED: 'success',
  ARCHIVED: 'default',
};

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-error mb-4">Client not found</p>
        <button onClick={() => navigate('/clients')} className="text-primary hover:underline">
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
        >
          <ArrowLeft size={18} />
          <span className="text-body-sm">Back to Clients</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-h1">{client.name}</h1>
            {client.contactPerson && (
              <p className="text-body text-text-secondary">{client.contactPerson}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.contactPerson && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Contact Person</p>
                  <div className="flex items-center gap-2 text-body-sm">
                    <UserCircle size={14} className="text-text-secondary" />
                    <span>{client.contactPerson}</span>
                  </div>
                </div>
              )}
              {client.email && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Email</p>
                  <div className="flex items-center gap-2 text-body-sm">
                    <Mail size={14} className="text-text-secondary" />
                    <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Phone</p>
                  <div className="flex items-center gap-2 text-body-sm">
                    <Phone size={14} className="text-text-secondary" />
                    <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.address && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Address</p>
                  <div className="flex items-center gap-2 text-body-sm">
                    <MapPin size={14} className="text-text-secondary" />
                    <span>{client.address}</span>
                  </div>
                </div>
              )}
              {client.notes && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Notes</p>
                  <p className="text-body-sm text-text-secondary">{client.notes}</p>
                </div>
              )}
              {!client.email && !client.phone && !client.address && !client.contactPerson && !client.notes && (
                <p className="text-body-sm text-text-tertiary">No contact details provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban size={18} />
                Projects ({client.projects?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!client.projects?.length ? (
                <div className="py-8 text-center">
                  <FolderKanban size={32} className="mx-auto text-text-tertiary mb-2" />
                  <p className="text-body-sm text-text-tertiary">No projects linked to this client</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {client.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderKanban size={18} className="text-text-tertiary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-body-sm font-medium text-text-primary truncate">
                            {project.name}
                          </p>
                          <div className="flex items-center gap-2 text-caption text-text-tertiary">
                            {project.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />
                                {project.location}
                              </span>
                            )}
                            {project.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(project.startDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={statusVariants[project.status] || 'default'} size="sm">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

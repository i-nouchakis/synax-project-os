import { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Square, Plus, Calendar, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  DateInput,
  Textarea,
  Select,
  Badge,
  Pagination,
  usePagination,
} from '@/components/ui';
import {
  timeEntryService,
  TIME_ENTRY_TYPE_LABELS,
  TIME_ENTRY_TYPE_COLORS,
} from '@/services/timeentry.service';
import type {
  TimeEntry,
  TimeEntryType,
  CreateTimeEntryData,
} from '@/services/timeentry.service';
import { projectService } from '@/services/project.service';
import type { Project } from '@/services/project.service';
import { useAuthStore } from '@/stores/auth.store';

const TIME_ENTRY_TYPE_OPTIONS = Object.entries(TIME_ENTRY_TYPE_LABELS).map(([key, label]) => ({
  value: key,
  label,
}));

export function TimeTrackingPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedEntries,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(entries, 25);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateTimeEntryData>({
    projectId: '',
    type: 'OTHER',
    hours: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const projectOptions = [
    { value: '', label: 'Select Project' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const filterProjectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [entriesData, projectsData] = await Promise.all([
        timeEntryService.getMyEntries({
          projectId: filterProjectId || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
        }),
        projectService.getAll(),
      ]);
      setEntries(entriesData);
      setProjects(projectsData);

      // Check for active timer (entry with startTime but no endTime and 0 hours)
      const active = entriesData.find(
        (e) => e.startTime && !e.endTime && e.hours === 0
      );
      if (active) {
        setActiveTimer(active);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterProjectId, filterStartDate, filterEndDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer update effect
  useEffect(() => {
    if (!activeTimer?.startTime) return;

    const interval = setInterval(() => {
      const start = new Date(activeTimer.startTime!).getTime();
      const now = Date.now();
      setTimerElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!formData.projectId) {
      toast.error('Please select a project first');
      return;
    }

    try {
      const entry = await timeEntryService.startTimer({
        projectId: formData.projectId,
        type: formData.type,
        description: formData.description,
      });
      setActiveTimer(entry);
      setTimerElapsed(0);
      toast.success('Timer started');
      await loadData();
    } catch (error) {
      console.error('Failed to start timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;

    try {
      await timeEntryService.stopTimer(activeTimer.id);
      setActiveTimer(null);
      setTimerElapsed(0);
      toast.success('Timer stopped');
      await loadData();
    } catch (error) {
      console.error('Failed to stop timer:', error);
      toast.error('Failed to stop timer');
    }
  };

  const handleSubmitManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.hours) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await timeEntryService.create(formData);
      setShowForm(false);
      setFormData({
        projectId: '',
        type: 'OTHER',
        hours: 1,
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      toast.success('Time entry created');
      await loadData();
    } catch (error) {
      console.error('Failed to create entry:', error);
      toast.error('Failed to create entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await timeEntryService.delete(id);
      toast.success('Time entry deleted');
      await loadData();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">Time Tracking</h1>
          <p className="text-body text-text-secondary mt-1">
            Track your work hours across projects
          </p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowForm(true)}>
          Add Entry
        </Button>
      </div>

      {/* Active Timer Card */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="text-h3 text-text-primary">
                  {activeTimer ? 'Timer Running' : 'Start Timer'}
                </h3>
                {activeTimer ? (
                  <p className="text-body-sm text-text-secondary">
                    {activeTimer.project?.name} -{' '}
                    {TIME_ENTRY_TYPE_LABELS[activeTimer.type]}
                  </p>
                ) : (
                  <p className="text-body-sm text-text-secondary">
                    Select a project to start tracking
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-display font-mono text-primary">
                {formatElapsedTime(timerElapsed)}
              </div>

              {activeTimer ? (
                <Button
                  variant="danger"
                  size="lg"
                  leftIcon={<Square size={18} />}
                  onClick={handleStopTimer}
                >
                  Stop
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={formData.projectId}
                    onChange={(e) =>
                      setFormData({ ...formData, projectId: e.target.value })
                    }
                    options={projectOptions}
                    className="w-48"
                  />
                  <Select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as TimeEntryType,
                      })
                    }
                    options={TIME_ENTRY_TYPE_OPTIONS}
                    className="w-40"
                  />
                  <Button
                    size="lg"
                    leftIcon={<Play size={18} />}
                    onClick={handleStartTimer}
                    disabled={!formData.projectId}
                  >
                    Start
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Manual Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitManualEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Project *"
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  options={projectOptions}
                />

                <Select
                  label="Type *"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as TimeEntryType,
                    })
                  }
                  options={TIME_ENTRY_TYPE_OPTIONS}
                />

                <DateInput
                  label="Date *"
                  value={formData.date}
                  onChange={(value) =>
                    setFormData({ ...formData, date: value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="Hours *"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })
                  }
                  min={0.1}
                  max={24}
                  step={0.25}
                  required
                />

                <Textarea
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What did you work on?"
                  className="md:col-span-2"
                  minRows={2}
                  maxRows={4}
                />
              </div>

              <Textarea
                label="Notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                minRows={2}
                maxRows={4}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Entry</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter size={18} className="text-text-secondary" />
            <Select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              options={filterProjectOptions}
              className="w-48"
            />
            <div className="flex items-center gap-2">
              <DateInput
                value={filterStartDate}
                onChange={(value) => setFilterStartDate(value)}
                className="w-40"
                placeholder="Start date"
              />
              <span className="text-text-secondary">to</span>
              <DateInput
                value={filterEndDate}
                onChange={(value) => setFilterEndDate(value)}
                className="w-40"
                placeholder="End date"
              />
            </div>
            {(filterProjectId || filterStartDate || filterEndDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterProjectId('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-caption text-text-secondary">Total Entries</p>
            <p className="text-h2 text-text-primary">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-caption text-text-secondary">Total Hours</p>
            <p className="text-h2 text-primary">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-caption text-text-secondary">This Week</p>
            <p className="text-h2 text-text-primary">
              {entries
                .filter((e) => {
                  const date = new Date(e.date);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return date >= weekAgo;
                })
                .reduce((sum, e) => sum + e.hours, 0)
                .toFixed(1)}
              h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-text-secondary">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No time entries found. Start tracking your work!
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {paginatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="py-4 flex items-center justify-between hover:bg-surface-secondary/50 -mx-4 px-4 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                      <Clock size={18} className="text-text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-body font-medium text-text-primary">
                          {entry.project?.name || 'Unknown Project'}
                        </span>
                        <Badge className={TIME_ENTRY_TYPE_COLORS[entry.type]}>
                          {TIME_ENTRY_TYPE_LABELS[entry.type]}
                        </Badge>
                      </div>
                      {entry.description && (
                        <p className="text-body-sm text-text-secondary">
                          {entry.description}
                        </p>
                      )}
                      <p className="text-caption text-text-tertiary">
                        {new Date(entry.date).toLocaleDateString()}
                        {entry.room && ` • ${entry.room.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-h3 text-primary">{entry.hours.toFixed(1)}h</p>
                      {entry.startTime && entry.endTime && (
                        <p className="text-caption text-text-tertiary">
                          {new Date(entry.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(entry.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                    {(user?.role === 'ADMIN' ||
                      user?.role === 'PM' ||
                      entry.userId === user?.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 size={16} className="text-error" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

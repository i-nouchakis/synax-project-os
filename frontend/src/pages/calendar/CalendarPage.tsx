import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Pencil,
  AlertTriangle,
  Users,
  Check,
  X as XIcon,
  UserPlus,
  Eye,
  Repeat,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
  Input,
  Select,
  DateInput,
} from '@/components/ui';
import { calendarService, EVENT_TYPES, RECURRENCE_OPTIONS, getEventColor, getRecurrenceLabel, type CalendarEvent, type CalendarEventType, type RecurrenceRule, type CreateCalendarEventData } from '@/services/calendar.service';
import { projectService } from '@/services/project.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSearchStore } from '@/stores/search.store';

// ─── Date helpers ───────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Sunday, we want Monday = 0
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Main Component ─────────────────────────────────────────
export function CalendarPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PM';
  const searchQuery = useSearchStore((s) => s.query);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Date range for query (fetch full month + overflow days)
  const queryStart = useMemo(() => {
    const d = new Date(year, month, 1);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, [year, month]);

  const queryEnd = useMemo(() => {
    const d = new Date(year, month + 1, 0);
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  }, [year, month]);

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', queryStart, queryEnd],
    queryFn: () => calendarService.getEvents({ start: queryStart, end: queryEnd }),
  });

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.project?.name.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Create mutation
  const createEventMutation = useMutation({
    mutationFn: (data: CreateCalendarEventData) => calendarService.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsCreateModalOpen(false);
      setSelectedDate(null);
      if (result.overlaps && result.overlaps.length > 0) {
        toast.warning(`Event created, but overlaps with: ${result.overlaps.map(o => o.title).join(', ')}`);
      } else {
        toast.success('Event created');
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create event'),
  });

  // Update mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCalendarEventData> }) =>
      calendarService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setEditingEvent(null);
      toast.success('Event updated');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update event'),
  });

  // Delete mutation
  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setDeletingEvent(null);
      setSelectedDayEvents(null);
      toast.success('Event deleted');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete event'),
  });

  // Respond to invite mutation
  const respondMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'ACCEPTED' | 'DECLINED' }) =>
      calendarService.respond(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Response saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to respond'),
  });

  // Navigation
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    // Open today's events popup for visual feedback
    const todayEvents = events.filter(event => isSameDay(new Date(event.startDate), today));
    setSelectedDayEvents({ date: today, events: todayEvents });
  };

  const goToPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return isSameDay(eventDate, date);
    });
  };

  // Build month grid
  const buildMonthGrid = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month overflow
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Next month overflow (fill to 42 cells = 6 rows)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }
    return cells;
  };

  // Build week grid
  const buildWeekGrid = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      cells.push({ date: d, isCurrentMonth: d.getMonth() === month });
    }
    return cells;
  };

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDayEvents({ date, events: dayEvents });
  };

  const handleAddFromDayView = () => {
    if (selectedDayEvents) {
      setSelectedDate(selectedDayEvents.date);
      setSelectedDayEvents(null);
      setIsCreateModalOpen(true);
    }
  };

  // ─── Drag & Drop handlers ──────────────────────────────────
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!canManage) return;
    // For recurring instances, store the original event id
    const eventId = event.originalEventId || event.id;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      eventId,
      startDate: event.startDate,
      endDate: event.endDate || null,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    if (!canManage) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!canManage) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { eventId, startDate: origStart, endDate: origEnd } = data as {
        eventId: string;
        startDate: string;
        endDate: string | null;
      };

      const oldStart = new Date(origStart);
      // If dropping on the same day, do nothing
      if (isSameDay(oldStart, targetDate)) return;

      // Calculate new start: keep the same time, change the date
      const newStart = new Date(targetDate);
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds());

      // Shift endDate by the same offset
      let newEnd: string | null = null;
      if (origEnd) {
        const oldEnd = new Date(origEnd);
        const diffMs = newStart.getTime() - oldStart.getTime();
        newEnd = new Date(oldEnd.getTime() + diffMs).toISOString();
      }

      updateEventMutation.mutate({
        id: eventId,
        data: {
          startDate: newStart.toISOString(),
          endDate: newEnd,
        },
      });
    } catch {
      // Ignore invalid drag data
    }
  };

  const weekLabel = useMemo(() => {
    const cells = buildWeekGrid();
    const start = cells[0].date;
    const end = cells[6].date;
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const grid = viewMode === 'month' ? buildMonthGrid() : buildWeekGrid();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h1 flex items-center gap-2">
            <CalendarIcon size={28} />
            Calendar
          </h1>
          <p className="text-body text-text-secondary mt-1">
            {viewMode === 'month' ? formatMonthYear(currentDate) : weekLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-surface-secondary rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-body-sm rounded-md transition-colors ${viewMode === 'month' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-body-sm rounded-md transition-colors ${viewMode === 'week' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Week
            </button>
          </div>
          <Button size="sm" variant="secondary" onClick={goToToday}>
            Today
          </Button>
          {canManage && (
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setSelectedDate(new Date());
                setIsCreateModalOpen(true);
              }}
            >
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <button
            onClick={viewMode === 'month' ? goToPrevMonth : goToPrevWeek}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-h3 text-text-primary">
            {viewMode === 'month' ? formatMonthYear(currentDate) : weekLabel}
          </h2>
          <button
            onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <CardContent className="p-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-surface-border">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2 text-center text-caption font-medium text-text-secondary">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={`grid grid-cols-7 ${viewMode === 'month' ? '' : ''}`}>
            {grid.map((cell, idx) => {
              const dayEvents = getEventsForDay(cell.date);
              const today = isToday(cell.date);
              const dateKey = cell.date.toISOString().split('T')[0];
              const isDragTarget = dragOverDate === dateKey;
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(cell.date, dayEvents)}
                  onDragOver={(e) => handleDragOver(e, dateKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cell.date)}
                  className={`
                    ${viewMode === 'month' ? 'min-h-[100px]' : 'min-h-[200px]'}
                    border-b border-r border-surface-border p-1.5 cursor-pointer
                    hover:bg-surface-hover/50 transition-colors
                    ${!cell.isCurrentMonth ? 'opacity-40' : ''}
                    ${idx % 7 === 0 ? 'border-l' : ''}
                    ${isDragTarget ? 'bg-primary/10 ring-2 ring-inset ring-primary/30' : ''}
                  `}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-body-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        ${today ? 'bg-primary text-white' : 'text-text-primary'}
                      `}
                    >
                      {cell.date.getDate()}
                    </span>
                    {dayEvents.length > 3 && viewMode === 'month' && (
                      <span className="text-caption text-text-tertiary">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, viewMode === 'month' ? 3 : 10).map((event) => {
                      const color = getEventColor(event.type, event.color);
                      const timeStr = event.allDay
                        ? 'All day'
                        : `${new Date(event.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}${event.endDate ? ` - ${new Date(event.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : ''}`;
                      return (
                      <div
                        key={event.id}
                        draggable={canManage}
                        onDragStart={(e) => handleDragStart(e, event)}
                        className={`px-1.5 py-0.5 rounded text-caption hover:opacity-80 ${canManage ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        style={{ backgroundColor: `${color}20`, color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayEvents({ date: cell.date, events: dayEvents });
                        }}
                        title={`${event.title} (${timeStr})${canManage ? ' — Drag to reschedule' : ''}`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          {event.isRecurring && <Repeat size={8} className="flex-shrink-0 opacity-60" />}
                          <span className="truncate">{event.title}</span>
                        </div>
                        <div className="text-[10px] opacity-70 truncate ml-2.5">{timeStr}</div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event type legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {EVENT_TYPES.map((type) => (
          <div key={type.value} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
            <span className="text-caption text-text-secondary">{type.label}</span>
          </div>
        ))}
      </div>

      {/* Day Events Popup */}
      {selectedDayEvents && (
        <Modal
          isOpen={!!selectedDayEvents}
          onClose={() => setSelectedDayEvents(null)}
          title={selectedDayEvents.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          icon={<CalendarIcon size={18} />}
          size="md"
          footer={
            canManage ? (
              <ModalActions>
                <Button variant="secondary" onClick={() => setSelectedDayEvents(null)}>
                  Close
                </Button>
                <Button leftIcon={<Plus size={16} />} onClick={handleAddFromDayView}>
                  Add Event
                </Button>
              </ModalActions>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {selectedDayEvents.events.length === 0 ? (
              <p className="text-body-sm text-text-secondary text-center py-4">No events</p>
            ) : (
              selectedDayEvents.events.map((event) => {
                const myAttendance = event.attendees?.find(a => a.userId === currentUser?.id);
                const isCreator = event.createdById === currentUser?.id;
                return (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-surface-secondary hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: getEventColor(event.type, event.color) }}
                      />
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-text-primary">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="default" size="sm">{event.type}</Badge>
                          {!event.allDay && (
                            <span className="text-caption text-text-secondary flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(event.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              {event.endDate && ` - ${new Date(event.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          )}
                          {event.allDay && (
                            <span className="text-caption text-text-secondary">All day</span>
                          )}
                          {event.project && (
                            <span className="text-caption text-primary">{event.project.name}</span>
                          )}
                          {event.isRecurring && (
                            <span className="text-caption text-text-tertiary flex items-center gap-1">
                              <Repeat size={10} />
                              {getRecurrenceLabel(event.recurrenceRule, event.recurrenceInterval)}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-caption text-text-secondary mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => setViewingEvent(event)}
                        className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-primary"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      {(isCreator || canManage) && (
                        <>
                          <button
                            onClick={() => {
                              // For recurring instances, edit the original event
                              if (event.originalEventId) {
                                const originalId = event.originalEventId;
                                calendarService.getById(originalId).then(orig => {
                                  setEditingEvent(orig);
                                  setSelectedDayEvents(null);
                                }).catch(() => toast.error('Failed to load event'));
                              } else {
                                setEditingEvent(event);
                                setSelectedDayEvents(null);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-primary"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              // For recurring instances, delete the original event
                              if (event.originalEventId) {
                                setDeletingEvent({ ...event, id: event.originalEventId } as CalendarEvent);
                              } else {
                                setDeletingEvent(event);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-error"
                            title={event.isRecurring ? 'Delete all occurrences' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Attendees */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="mt-2 ml-6 flex items-center gap-2 flex-wrap">
                      <Users size={12} className="text-text-tertiary" />
                      {event.attendees.map((att) => (
                        <Badge
                          key={att.id}
                          variant={att.status === 'ACCEPTED' ? 'success' : att.status === 'DECLINED' ? 'default' : 'warning'}
                          size="sm"
                        >
                          {att.user.name}
                          {att.status === 'PENDING' && ' ?'}
                          {att.status === 'DECLINED' && ' ✗'}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Accept/Decline buttons if I'm invited */}
                  {myAttendance && myAttendance.status === 'PENDING' && (
                    <div className="mt-2 ml-6 flex items-center gap-2">
                      <span className="text-caption text-text-secondary">You're invited:</span>
                      <button
                        onClick={() => respondMutation.mutate({ eventId: event.id, status: 'ACCEPTED' })}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-caption hover:bg-success/20"
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        onClick={() => respondMutation.mutate({ eventId: event.id, status: 'DECLINED' })}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-error/10 text-error text-caption hover:bg-error/20"
                      >
                        <XIcon size={12} /> Decline
                      </button>
                    </div>
                  )}
                </div>
                );})
              )}
          </div>
        </Modal>
      )}

      {/* Create / Edit Event Modal */}
      <EventFormModal
        isOpen={isCreateModalOpen || !!editingEvent}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
          setSelectedDate(null);
        }}
        onSubmit={(data) => {
          if (editingEvent) {
            updateEventMutation.mutate({ id: editingEvent.id, data });
          } else {
            createEventMutation.mutate(data);
          }
        }}
        isLoading={createEventMutation.isPending || updateEventMutation.isPending}
        event={editingEvent}
        defaultDate={selectedDate}
        projects={projects}
      />

      {/* Event Detail Modal */}
      {viewingEvent && (
        <Modal
          isOpen={!!viewingEvent}
          onClose={() => setViewingEvent(null)}
          title={viewingEvent.title}
          icon={<CalendarIcon size={18} />}
          size="md"
          nested
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setViewingEvent(null)}>
                Close
              </Button>
              {canManage && (
                <Button
                  leftIcon={<Pencil size={14} />}
                  onClick={() => {
                    if (viewingEvent.originalEventId) {
                      calendarService.getById(viewingEvent.originalEventId).then(orig => {
                        setEditingEvent(orig);
                        setViewingEvent(null);
                        setSelectedDayEvents(null);
                      }).catch(() => toast.error('Failed to load event'));
                    } else {
                      setEditingEvent(viewingEvent);
                      setViewingEvent(null);
                      setSelectedDayEvents(null);
                    }
                  }}
                >
                  Edit
                </Button>
              )}
            </ModalActions>
          }
        >
          <div className="space-y-5">
            {/* Type & Project */}
            <ModalSection title="Event Info" icon={<CalendarIcon size={14} />}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getEventColor(viewingEvent.type, viewingEvent.color) }}
                  />
                  <Badge variant="default">{EVENT_TYPES.find(t => t.value === viewingEvent.type)?.label || viewingEvent.type}</Badge>
                  {viewingEvent.project && (
                    <Badge variant="info">{viewingEvent.project.name}</Badge>
                  )}
                </div>
                {viewingEvent.description && (
                  <p className="text-body-sm text-text-secondary">{viewingEvent.description}</p>
                )}
                {viewingEvent.isRecurring && viewingEvent.recurrenceRule && (
                  <div className="flex items-center gap-2 mt-1">
                    <Repeat size={14} className="text-text-tertiary" />
                    <span className="text-body-sm text-text-secondary">
                      {getRecurrenceLabel(viewingEvent.recurrenceRule, viewingEvent.recurrenceInterval)}
                      {viewingEvent.recurrenceEnd && (
                        <> &middot; Until {new Date(viewingEvent.recurrenceEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </ModalSection>

            {/* Date & Time */}
            <ModalSection title="Date & Time" icon={<Clock size={14} />}>
              <div className="space-y-2">
                {viewingEvent.allDay ? (
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-text-tertiary" />
                    <span className="text-body-sm text-text-primary">
                      {new Date(viewingEvent.startDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {viewingEvent.endDate && (
                        <> &mdash; {new Date(viewingEvent.endDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</>
                      )}
                    </span>
                    <Badge variant="default" size="sm">All day</Badge>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-text-tertiary" />
                      <span className="text-body-sm text-text-primary">
                        <strong>From:</strong>{' '}
                        {new Date(viewingEvent.startDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                        {new Date(viewingEvent.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {viewingEvent.endDate && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-text-tertiary" />
                        <span className="text-body-sm text-text-primary">
                          <strong>To:</strong>{' '}
                          {new Date(viewingEvent.endDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                          {new Date(viewingEvent.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ModalSection>

            {/* Attendees */}
            {viewingEvent.attendees && viewingEvent.attendees.length > 0 && (
              <ModalSection title={`Attendees (${viewingEvent.attendees.length})`} icon={<Users size={14} />}>
                <div className="space-y-2">
                  {viewingEvent.attendees.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-surface-hover flex items-center justify-center text-caption font-medium text-text-secondary">
                          {att.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-body-sm text-text-primary">{att.user.name}</p>
                          <p className="text-caption text-text-tertiary">{att.user.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={att.status === 'ACCEPTED' ? 'success' : att.status === 'DECLINED' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {att.status === 'ACCEPTED' ? 'Accepted' : att.status === 'DECLINED' ? 'Declined' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ModalSection>
            )}

            {/* Created by */}
            {viewingEvent.createdBy && (
              <div className="flex items-center gap-2 text-caption text-text-tertiary pt-2 border-t border-surface-border">
                <span>Created by <strong className="text-text-secondary">{viewingEvent.createdBy.name}</strong></span>
                <span>&middot;</span>
                <span>{new Date(viewingEvent.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingEvent && (
        <Modal
          isOpen={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          title="Delete Event"
          icon={<AlertTriangle size={18} />}
          size="sm"
          nested
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeletingEvent(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteEventMutation.mutate(deletingEvent.id)}
                isLoading={deleteEventMutation.isPending}
              >
                Delete Event
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-body text-text-primary mb-2">
              Delete <strong>{deletingEvent.title}</strong>?
            </p>
            <p className="text-body-sm text-text-secondary">
              {deletingEvent.isRecurring
                ? 'This will delete the event and all its recurring occurrences.'
                : 'This action cannot be undone.'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Event Form Modal ───────────────────────────────────────
interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCalendarEventData) => void;
  isLoading: boolean;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
  projects: { id: string; name: string }[];
}

function EventFormModal({ isOpen, onClose, onSubmit, isLoading, event, defaultDate, projects }: EventFormModalProps) {
  const isEdit = !!event;
  const defaultDateStr = defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: defaultDateStr,
    endDate: '',
    allDay: true,
    type: 'REMINDER' as CalendarEventType,
    projectId: '',
    attendeeIds: [] as string[],
    recurrenceRule: '' as RecurrenceRule | '',
    recurrenceInterval: 1,
    recurrenceEnd: '',
  });

  // Fetch users for invite picker
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: isOpen,
  });

  const { user: currentUser } = useAuthStore();

  // Sync form with event/defaultDate when modal opens
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [lastDefaultDate, setLastDefaultDate] = useState<string | null>(null);

  if (isOpen) {
    if (event && event.id !== lastEventId) {
      setLastEventId(event.id);
      setLastDefaultDate(null);
      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate ? event.endDate.split('T')[0] : '',
        allDay: event.allDay,
        type: event.type,
        projectId: event.projectId || '',
        attendeeIds: event.attendees?.map(a => a.userId) || [],
        recurrenceRule: event.recurrenceRule || '',
        recurrenceInterval: event.recurrenceInterval || 1,
        recurrenceEnd: event.recurrenceEnd ? event.recurrenceEnd.split('T')[0] : '',
      });
    } else if (!event && defaultDateStr !== lastDefaultDate && !lastEventId) {
      setLastDefaultDate(defaultDateStr);
      setFormData({
        title: '',
        description: '',
        startDate: defaultDateStr,
        endDate: '',
        allDay: true,
        type: 'REMINDER',
        projectId: '',
        attendeeIds: [],
        recurrenceRule: '',
        recurrenceInterval: 1,
        recurrenceEnd: '',
      });
    }
  }

  const handleClose = () => {
    setLastEventId(null);
    setLastDefaultDate(null);
    onClose();
  };

  const toggleAttendee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(userId)
        ? prev.attendeeIds.filter(id => id !== userId)
        : [...prev.attendeeIds, userId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description || undefined,
      startDate: formData.allDay
        ? new Date(formData.startDate + 'T00:00:00').toISOString()
        : new Date(formData.startDate).toISOString(),
      endDate: formData.endDate
        ? (formData.allDay
          ? new Date(formData.endDate + 'T23:59:59').toISOString()
          : new Date(formData.endDate).toISOString())
        : null,
      allDay: formData.allDay,
      type: formData.type,
      projectId: formData.projectId || null,
      attendeeIds: formData.attendeeIds.length > 0 ? formData.attendeeIds : undefined,
      recurrenceRule: formData.recurrenceRule || null,
      recurrenceInterval: formData.recurrenceRule ? formData.recurrenceInterval : 1,
      recurrenceEnd: formData.recurrenceRule && formData.recurrenceEnd
        ? new Date(formData.recurrenceEnd + 'T23:59:59').toISOString()
        : null,
    });
  };

  // Users available to invite (exclude current user)
  const invitableUsers = allUsers.filter(u => u.id !== currentUser?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Event' : 'New Event'}
      icon={<CalendarIcon size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="event-form" isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
        </ModalActions>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Event Details" icon={<CalendarIcon size={14} />}>
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title..."
              required
            />
            <Input
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Details about this event..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEventType })}
                options={EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))}
              />
              <Select
                label="Project (Optional)"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                options={projects.map(p => ({ value: p.id, label: p.name }))}
                placeholder="No project"
              />
            </div>
          </div>
        </ModalSection>

        <ModalSection title="Date & Time" icon={<Clock size={14} />}>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                className="w-4 h-4 rounded border-surface-border text-primary focus:ring-primary/20"
              />
              <span className="text-body-sm text-text-primary">All day event</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {formData.allDay ? (
                <>
                  <DateInput
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(value) => setFormData({ ...formData, startDate: value })}
                  />
                  <DateInput
                    label="End Date (Optional)"
                    value={formData.endDate}
                    onChange={(value) => setFormData({ ...formData, endDate: value })}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Start"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                  <Input
                    label="End (Optional)"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </>
              )}
            </div>
          </div>
        </ModalSection>

        <ModalSection title="Repeat" icon={<Repeat size={14} />}>
          <div className="space-y-4">
            <Select
              label="Recurrence"
              value={formData.recurrenceRule}
              onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value as RecurrenceRule | '' })}
              options={RECURRENCE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            />
            {formData.recurrenceRule && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Every X ${formData.recurrenceRule === 'DAILY' ? 'days' : formData.recurrenceRule === 'WEEKLY' ? 'weeks' : formData.recurrenceRule === 'MONTHLY' ? 'months' : 'years'}`}
                  type="number"
                  min={1}
                  max={99}
                  value={formData.recurrenceInterval}
                  onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                />
                <DateInput
                  label="End Date (Optional)"
                  value={formData.recurrenceEnd}
                  onChange={(value) => setFormData({ ...formData, recurrenceEnd: value })}
                />
              </div>
            )}
          </div>
        </ModalSection>

        <ModalSection title="Invite People" icon={<UserPlus size={14} />}>
          <div className="space-y-3">
            {invitableUsers.length === 0 ? (
              <p className="text-caption text-text-tertiary">No users available to invite</p>
            ) : (
              <div className="max-h-[160px] overflow-y-auto space-y-1">
                {invitableUsers.map((u) => {
                  const isSelected = formData.attendeeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAttendee(u.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-surface-secondary hover:bg-surface-hover border border-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-medium ${
                        isSelected ? 'bg-primary text-white' : 'bg-surface-hover text-text-secondary'
                      }`}>
                        {isSelected ? <Check size={14} /> : u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm text-text-primary truncate">{u.name}</p>
                        <p className="text-caption text-text-tertiary truncate">{u.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {formData.attendeeIds.length > 0 && (
              <p className="text-caption text-text-secondary">
                {formData.attendeeIds.length} {formData.attendeeIds.length === 1 ? 'person' : 'people'} invited
              </p>
            )}
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}

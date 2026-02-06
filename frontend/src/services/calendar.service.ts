import { api } from '@/lib/api';

export type CalendarEventType = 'APPOINTMENT' | 'REMINDER' | 'DEADLINE' | 'MEETING' | 'INSPECTION' | 'DELIVERY';
export type AttendeeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type RecurrenceRule = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface CalendarEventAttendee {
  id: string;
  eventId: string;
  userId: string;
  status: AttendeeStatus;
  user: { id: string; name: string; email: string };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  allDay: boolean;
  type: CalendarEventType;
  color?: string | null;
  projectId?: string | null;
  createdById: string;
  recurrenceRule?: RecurrenceRule | null;
  recurrenceInterval?: number;
  recurrenceEnd?: string | null;
  isRecurring?: boolean;
  originalEventId?: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string };
  attendees?: CalendarEventAttendee[];
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
  type?: CalendarEventType;
  color?: string | null;
  projectId?: string | null;
  attendeeIds?: string[];
  recurrenceRule?: RecurrenceRule | null;
  recurrenceInterval?: number;
  recurrenceEnd?: string | null;
}

export type UpdateCalendarEventData = Partial<CreateCalendarEventData>;

interface EventsResponse {
  events: CalendarEvent[];
}

interface CreateEventResponse {
  event: CalendarEvent;
  overlaps?: { id: string; title: string }[];
}

interface EventResponse {
  event: CalendarEvent;
}

export const EVENT_TYPES: { value: CalendarEventType; label: string; color: string }[] = [
  { value: 'APPOINTMENT', label: 'Appointment', color: '#3b82f6' },
  { value: 'REMINDER', label: 'Reminder', color: '#f59e0b' },
  { value: 'DEADLINE', label: 'Deadline', color: '#ef4444' },
  { value: 'MEETING', label: 'Meeting', color: '#8b5cf6' },
  { value: 'INSPECTION', label: 'Inspection', color: '#10b981' },
  { value: 'DELIVERY', label: 'Delivery', color: '#06b6d4' },
];

export const RECURRENCE_OPTIONS: { value: RecurrenceRule | ''; label: string }[] = [
  { value: '', label: 'No repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export function getRecurrenceLabel(rule: RecurrenceRule | null | undefined, interval?: number): string {
  if (!rule) return '';
  const i = interval || 1;
  switch (rule) {
    case 'DAILY': return i === 1 ? 'Daily' : `Every ${i} days`;
    case 'WEEKLY': return i === 1 ? 'Weekly' : `Every ${i} weeks`;
    case 'MONTHLY': return i === 1 ? 'Monthly' : `Every ${i} months`;
    case 'YEARLY': return i === 1 ? 'Yearly' : `Every ${i} years`;
    default: return '';
  }
}

export function getEventColor(type: CalendarEventType, customColor?: string | null): string {
  if (customColor) return customColor;
  return EVENT_TYPES.find(t => t.value === type)?.color || '#6b7280';
}

export const calendarService = {
  async getEvents(params?: { start?: string; end?: string; projectId?: string }): Promise<CalendarEvent[]> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    const query = searchParams.toString();
    const response = await api.get<EventsResponse>(`/calendar${query ? `?${query}` : ''}`);
    return response.events;
  },

  async getById(id: string): Promise<CalendarEvent> {
    const response = await api.get<EventResponse>(`/calendar/${id}`);
    return response.event;
  },

  async create(data: CreateCalendarEventData): Promise<{ event: CalendarEvent; overlaps?: { id: string; title: string }[] }> {
    const response = await api.post<CreateEventResponse>('/calendar', data);
    return response;
  },

  async update(id: string, data: UpdateCalendarEventData): Promise<CalendarEvent> {
    const response = await api.put<EventResponse>(`/calendar/${id}`, data);
    return response.event;
  },

  async respond(eventId: string, status: AttendeeStatus): Promise<void> {
    await api.post(`/calendar/${eventId}/respond`, { status });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/calendar/${id}`);
  },
};

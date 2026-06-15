export interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email?: string; displayName?: string; responseStatus?: string }[];
  htmlLink?: string;
  status?: string;
  _calendarId?: string;
}

export interface CalendarInfo {
  id: string;
  summary?: string;
  color: string;
}

export type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";
export type Priority = "high" | "medium" | "low";

export interface CreateEventForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string;
  description: string;
  allDay: boolean;
  calendarId: string;
}

export interface EditEventForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  attendees: string;
  calendarId: string;
}

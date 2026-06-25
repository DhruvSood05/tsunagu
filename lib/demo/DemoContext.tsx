"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { DEMO_EMAILS, DEMO_EVENTS, DEMO_USER, DEMO_CALENDAR } from "./demo-data";

export interface DemoDraft {
  id: string;
  to: string;
  subject: string;
  body: string;
  savedAt: Date;
}

interface DemoContextValue {
  // User
  user: typeof DEMO_USER;

  // Email state
  emails: any[];
  setEmails: (emails: any[]) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  toggleStar: (id: string) => void;
  archiveEmail: (id: string) => void;
  deleteEmail: (id: string) => void;
  bulkDelete: (ids: string[]) => void;
  getEmailById: (id: string) => any | undefined;

  // Draft state
  drafts: DemoDraft[];
  saveDraft: (draft: { to: string; subject: string; body: string }) => void;
  updateDraft: (id: string, patch: { to: string; subject: string; body: string }) => void;
  deleteDraft: (id: string) => void;

  // Calendar state
  events: any[];
  addEvent: (event: any) => void;
  updateEvent: (id: string, patch: Partial<any>) => void;
  deleteEvent: (id: string) => void;
  calendars: any[];

  // UI state
  showSignInModal: boolean;
  setShowSignInModal: (open: boolean) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoContext must be used inside DemoProvider");
  return ctx;
}

let _idCounter = 100;
const genId = () => `demo-new-${++_idCounter}`;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [emails, setEmailsRaw] = useState<any[]>(() =>
    // deep-clone so mutations don't touch the original
    DEMO_EMAILS.map((e) => ({ ...e, labelIds: [...(e.labelIds ?? [])] }))
  );
  const [events, setEvents] = useState<any[]>(() =>
    DEMO_EVENTS.map((e) => ({ ...e }))
  );
  const [drafts, setDrafts] = useState<DemoDraft[]>([]);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const setEmails = useCallback((next: any[]) => setEmailsRaw(next), []);

  const markRead = useCallback((id: string) => {
    setEmailsRaw((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, labelIds: (e.labelIds ?? []).filter((l: string) => l !== "UNREAD") }
          : e
      )
    );
  }, []);

  const markUnread = useCallback((id: string) => {
    setEmailsRaw((prev) =>
      prev.map((e) =>
        e.id === id && !(e.labelIds ?? []).includes("UNREAD")
          ? { ...e, labelIds: [...(e.labelIds ?? []), "UNREAD"] }
          : e
      )
    );
  }, []);

  const toggleStar = useCallback((id: string) => {
    setEmailsRaw((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const starred = (e.labelIds ?? []).includes("STARRED");
        return {
          ...e,
          labelIds: starred
            ? (e.labelIds ?? []).filter((l: string) => l !== "STARRED")
            : [...(e.labelIds ?? []), "STARRED"],
        };
      })
    );
  }, []);

  const archiveEmail = useCallback((id: string) => {
    setEmailsRaw((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, labelIds: (e.labelIds ?? []).filter((l: string) => l !== "INBOX") }
          : e
      )
    );
  }, []);

  const deleteEmail = useCallback((id: string) => {
    setEmailsRaw((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const bulkDelete = useCallback((ids: string[]) => {
    setEmailsRaw((prev) => prev.filter((e) => !ids.includes(e.id)));
  }, []);

  const getEmailById = useCallback(
    (id: string) => emails.find((e) => e.id === id),
    [emails]
  );

  const saveDraft = useCallback((draft: { to: string; subject: string; body: string }) => {
    const newDraft: DemoDraft = { ...draft, id: genId(), savedAt: new Date() };
    setDrafts((prev) => [newDraft, ...prev]);
  }, []);

  const updateDraft = useCallback((id: string, patch: { to: string; subject: string; body: string }) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch, savedAt: new Date() } : d))
    );
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addEvent = useCallback((event: any) => {
    const newEvent = { ...event, id: event.id ?? genId(), _calendarId: "primary" };
    setEvents((prev) => [...prev, newEvent]);
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<any>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <DemoContext.Provider
      value={{
        user: DEMO_USER,
        emails,
        setEmails,
        markRead,
        markUnread,
        toggleStar,
        archiveEmail,
        deleteEmail,
        bulkDelete,
        getEmailById,
        drafts,
        saveDraft,
        updateDraft,
        deleteDraft,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        calendars: DEMO_CALENDAR,
        showSignInModal,
        setShowSignInModal,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

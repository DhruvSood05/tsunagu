"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DEMO_EMAILS, DEMO_EVENTS, DEMO_USER, DEMO_CALENDAR } from "./demo-data";

const LS_EMAILS  = "tsunagu_demo_emails";
const LS_EVENTS  = "tsunagu_demo_events";
const LS_DRAFTS  = "tsunagu_demo_drafts";

function lsGet<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback();
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

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

  /** Wipe localStorage and restore all demo data to its original state */
  resetDemo: () => void;
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
    lsGet(LS_EMAILS, () =>
      DEMO_EMAILS.map((e) => ({ ...e, labelIds: [...(e.labelIds ?? [])] }))
    )
  );
  const [events, setEvents] = useState<any[]>(() =>
    lsGet(LS_EVENTS, () => DEMO_EVENTS.map((e) => ({ ...e })))
  );
  const [drafts, setDrafts] = useState<DemoDraft[]>(() =>
    lsGet<DemoDraft[]>(LS_DRAFTS, () => []).map((d) => ({
      ...d,
      savedAt: new Date(d.savedAt), // revive Date from JSON string
    }))
  );
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Persist to localStorage whenever state changes
  useEffect(() => { lsSet(LS_EMAILS, emails); }, [emails]);
  useEffect(() => { lsSet(LS_EVENTS, events); }, [events]);
  useEffect(() => { lsSet(LS_DRAFTS, drafts); }, [drafts]);

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

  const resetDemo = useCallback(() => {
    try {
      localStorage.removeItem(LS_EMAILS);
      localStorage.removeItem(LS_EVENTS);
      localStorage.removeItem(LS_DRAFTS);
    } catch {}
    setEmailsRaw(DEMO_EMAILS.map((e) => ({ ...e, labelIds: [...(e.labelIds ?? [])] })));
    setEvents(DEMO_EVENTS.map((e) => ({ ...e })));
    setDrafts([]);
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
        resetDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

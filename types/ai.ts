export type ChatArtifact =
  | {
      kind: "email";
      status: "sent" | "draft";
      to: string;
      subject: string;
      body: string;
    }
  | {
      kind: "event";
      summary: string;
      start?: string | null;
      end?: string | null;
      timeZone?: string | null;
      location?: string | null;
      description?: string | null;
      attendees?: string[] | null;
      allDay?: boolean | null;
      eventId?: string | null;
      htmlLink?: string | null;
    };

export interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  artifacts?: ChatArtifact[];
}

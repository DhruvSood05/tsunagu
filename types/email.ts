export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailPayload {
  headers?: EmailHeader[];
  mimeType?: string;
  body?: { data?: string };
  parts?: EmailPayload[];
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: EmailPayload;
  _gravatarUrl?: string;
}

export interface Draft {
  id: string;
  message?: { id: string; threadId?: string };
}

export interface SelectedDraft {
  id: string;
  to: string;
  subject: string;
  body: string;
}

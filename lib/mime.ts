import nodemailer from "nodemailer";

interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface RawEmailOptions {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  text: string;
  inReplyTo?: string;
  references?: string;
  attachments?: Attachment[];
}

export async function buildRawEmail(options: RawEmailOptions): Promise<string> {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });

  const info = await transport.sendMail({
    from: options.from,
    to: options.to,
    cc: options.cc || undefined,
    subject: options.subject,
    text: options.text,
    inReplyTo: options.inReplyTo,
    references: options.references,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });

  return (info.message as unknown as Buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

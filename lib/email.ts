function findPart(parts: any[], mimeType: string): string {
  for (const part of parts ?? []) {
    if (!part) continue;
    if (part.mimeType === mimeType && part.body?.data) return part.body.data;
    if (part.parts) {
      const nested = findPart(part.parts, mimeType);
      if (nested) return nested;
    }
  }
  return "";
}

function b64decode(data: string): string {
  if (!data) return "";
  try {
    // Gmail uses URL-safe base64 without padding — normalise before decoding
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    // Decode as UTF-8 so non-ASCII characters aren't garbled
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

export function getHeader(message: any, name: string): string {
  const lower = name.toLowerCase();
  return (
    message?.payload?.headers?.find(
      (h: { name: string; value: string }) => h.name.toLowerCase() === lower
    )?.value ?? ""
  );
}

export function decodeEmailBody(message: any): {
  content: string;
  isHtml: boolean;
} {
  const payload = message?.payload;
  if (!payload) return { content: message?.snippet ?? "", isHtml: false };

  let htmlData = "";
  let textData = "";

  if (payload.mimeType === "text/html") {
    htmlData = payload.body?.data ?? "";
  } else if (payload.mimeType === "text/plain") {
    textData = payload.body?.data ?? "";
  } else {
    // multipart/* — recurse into parts
    htmlData = findPart(payload.parts ?? [], "text/html");
    textData = findPart(payload.parts ?? [], "text/plain");
  }

  if (htmlData) return { content: b64decode(htmlData), isHtml: true };
  if (textData) return { content: b64decode(textData), isHtml: false };
  return { content: message?.snippet ?? "", isHtml: false };
}

// kept for components that use plain text only
export function decodeBody(message: any): string {
  return decodeEmailBody(message).content;
}

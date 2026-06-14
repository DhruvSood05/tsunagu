const EVENT_KEYWORDS = [
  /\bmeet(ing)?\b/i,
  /\binvit(e|ation|ed)\b/i,
  /\bschedul(e|ed|ing)\b/i,
  /\bappointment\b/i,
  /\bconference\b/i,
  /\bwebinar\b/i,
  /\binterview\b/i,
  /\bzoom\b/i,
  /\bteams\b/i,
  /\bgoogle meet\b/i,
  /\bsave the date\b/i,
  /\bjoin us\b/i,
  /\brsvp\b/i,
  /\bsession\b/i,
  /\bevent\b/i,
  /\bworkshop\b/i,
  /\bsyncing up\b/i,
  /\bsync up\b/i,
  /\bcatch up\b/i,
];

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

export function isEventEmail(subject: string, snippet: string): boolean {
  const text = `${subject} ${snippet}`;
  return EVENT_KEYWORDS.some((re) => re.test(text));
}

export function extractDate(text: string): string | null {
  // ISO: 2026-06-15
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  // Slash/dash numeric: 6/15/2026 or 6-15-26
  const slash = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (slash) {
    const [, m, d, y] = slash;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Named month: "June 15, 2026" / "Jun 15" / "Tuesday, June 15"
  const monthNames = Object.keys(MONTHS).join("|");
  const named = text.match(
    new RegExp(
      `\\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\\s+)?(${monthNames})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`,
      "i"
    )
  );
  if (named) {
    const [, monthStr, day, year] = named;
    const month = MONTHS[monthStr.toLowerCase().slice(0, 3)];
    const y = year ?? new Date().getFullYear().toString();
    return `${y}-${month}-${day.padStart(2, "0")}`;
  }

  // "tomorrow"
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  // Day name without date (next occurrence)
  const dayMatch = text.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i);
  if (dayMatch) {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const target = dayNames.indexOf(dayMatch[1].toLowerCase());
    const d = new Date();
    const current = d.getDay();
    const diff = (target - current + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  return null;
}

export function extractTime(text: string): string | null {
  // "3:00 PM" / "15:00"
  const withColon = text.match(/\b(\d{1,2}):(\d{2})\s*([AP]M)?\b/i);
  if (withColon) {
    let [, h, m, ampm] = withColon;
    let hours = parseInt(h);
    if (ampm?.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (ampm?.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${m}`;
  }

  // "3pm" / "11 AM"
  const simple = text.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (simple) {
    const [, h, ap] = simple;
    let hours = parseInt(h);
    if (ap.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (ap.toUpperCase() === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:00`;
  }

  return null;
}

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${Math.min(h + 1, 23).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export interface DetectedEvent {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isLikelyEvent: boolean;
}

export function detectEventFromEmail(
  subject: string,
  snippet: string,
  bodyText: string,
  senderName: string,
  senderEmail: string
): DetectedEvent {
  const searchText = `${subject} ${snippet} ${bodyText}`;
  const isLikelyEvent = isEventEmail(subject, snippet);

  const detectedDate = extractDate(searchText) ?? new Date().toISOString().slice(0, 10);
  const detectedTime = extractTime(searchText) ?? "09:00";
  const endTime = addHour(detectedTime);

  return {
    title: subject || "New Event",
    date: detectedDate,
    startTime: detectedTime,
    endTime,
    description: `From: ${senderName || senderEmail} <${senderEmail}>\nSubject: ${subject}`,
    isLikelyEvent,
  };
}

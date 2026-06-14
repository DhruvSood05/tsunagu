import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DraftsContent from "./DraftsContent";

export default async function DraftsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  let gmailConnected = false;
  let calendarConnected = false;
  try {
    const status = await corsair.manage.connectionStatus.get({
      tenantId: session.user.id,
    });
    gmailConnected = status["gmail"] === "connected";
    calendarConnected = status["googlecalendar"] === "connected";
  } catch {
    // tenant may not exist yet
  }

  if (!gmailConnected || !calendarConnected) redirect("/dashboard");

  return <DraftsContent gmailConnected={gmailConnected} calendarConnected={calendarConnected} />;
}

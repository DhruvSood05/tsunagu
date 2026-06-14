import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AIContent from "./AIContent";

export default async function AIPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  let gmailConnected = false;
  let calendarConnected = false;
  try {
    const status = await corsair.manage.connectionStatus.get({ tenantId: session.user.id });
    gmailConnected = status["gmail"] === "connected";
    calendarConnected = status["googlecalendar"] === "connected";
  } catch {}

  return (
    <AIContent
      user={session.user}
      gmailConnected={gmailConnected}
      calendarConnected={calendarConnected}
    />
  );
}

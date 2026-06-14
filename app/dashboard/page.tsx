import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ConnectCalendar from "./ConnectCalendar";
import ConnectGmail from "./ConnectGmail";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
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
    // tenant may not exist yet — treat as not connected
  }

  if (!gmailConnected) return <ConnectGmail />;
  if (!calendarConnected) return <ConnectCalendar />;

  return (
    <DashboardContent gmailConnected={gmailConnected} calendarConnected={calendarConnected} />
  );
}

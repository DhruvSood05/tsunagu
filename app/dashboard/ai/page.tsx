import { corsair, db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { userPreferences } from "@/db/schema";
import { isSuperAdmin } from "@/lib/ai-rate-limit";
import AIContent from "./AIContent";
import AILockedPage from "./AILockedPage";

export default async function AIPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const email = session.user.email ?? "";

  // Check AI access
  let hasAccess = isSuperAdmin(email);
  if (!hasAccess) {
    const [prefs] = await db
      .select({ aiAccess: userPreferences.aiAccess, role: userPreferences.role })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id));

    const role = prefs?.role ?? "user";
    hasAccess = (prefs?.aiAccess === true) || role === "admin" || role === "superadmin";
  }

  if (!hasAccess) {
    return <AILockedPage user={session.user} />;
  }

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

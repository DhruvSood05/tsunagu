import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/ai-rate-limit";
import AdminContent from "./AdminContent";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const email = session.user.email ?? "";
  const superAdmin = checkSuperAdmin(email);

  // Allow if superadmin by email OR has admin/superadmin role in DB
  if (!superAdmin) {
    const [prefs] = await db
      .select({ role: userPreferences.role })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id));

    const role = prefs?.role ?? "user";
    if (role !== "admin" && role !== "superadmin") redirect("/dashboard");
  }

  return (
    <AdminContent
      currentUser={{ name: session.user.name, email: session.user.email, image: session.user.image }}
      isSuperAdmin={superAdmin}
    />
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/ai-rate-limit";
import AdminContent from "./AdminContent";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  if (!isAdmin(session.user.email ?? "")) redirect("/dashboard");

  return <AdminContent currentUser={{ name: session.user.name, email: session.user.email, image: session.user.image }} />;
}

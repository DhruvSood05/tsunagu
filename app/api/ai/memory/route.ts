import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import Supermemory from "supermemory";

const supermemory = process.env.SUPERMEMORY_API_KEY ? new Supermemory() : null;

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!supermemory) return Response.json({ memories: [], enabled: false });

  try {
    const result = await (supermemory.documents as any).list({
      containerTag: `user:${session.user.id}`,
      limit: 50,
    });
    const memories = (result?.documents ?? result?.results ?? result?.data ?? []).map((m: any) => ({
      id: m.id,
      content: m.content ?? m.text ?? "",
      createdAt: m.createdAt ?? m.created_at ?? null,
    }));
    return Response.json({ memories, enabled: true });
  } catch (err: any) {
    return Response.json({ memories: [], enabled: true, error: err?.message });
  }
}

export async function DELETE(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!supermemory) return Response.json({ success: false });

  const { id } = await req.json();
  try {
    await (supermemory.documents as any).delete(id);
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ success: false, error: err?.message });
  }
}

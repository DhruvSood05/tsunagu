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
    const memories = (result?.memories ?? []).map((m: any) => ({
      id: m.id,
      title: m.title ?? "",
      summary: m.summary ?? "",
      createdAt: m.createdAt ?? null,
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

  const body = await req.json();

  // Delete all: no id provided
  if (!body.id) {
    try {
      const result = await (supermemory.documents as any).list({
        containerTag: `user:${session.user.id}`,
        limit: 200,
      });
      const ids: string[] = (result?.memories ?? []).map((m: any) => m.id).filter(Boolean);
      if (ids.length > 0) {
        await (supermemory.documents as any).deleteBulk({ ids });
      }
      return Response.json({ success: true, deleted: ids.length });
    } catch (err: any) {
      return Response.json({ success: false, error: err?.message });
    }
  }

  // Delete single
  try {
    await (supermemory.documents as any).delete(body.id);
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ success: false, error: err?.message });
  }
}

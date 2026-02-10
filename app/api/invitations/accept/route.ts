import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { boardId } = body as { boardId?: string };
  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Service role key missing. Invite acceptance requires SUPABASE_SERVICE_ROLE_KEY on the server.",
          code: "MISSING_SERVICE_ROLE_KEY",
        },
        { status: 400 }
      );
    }

    const user = await clerkClient.users.getUser(userId);
    const pendingInvites = (user.publicMetadata?.pendingInvites as any[]) || [];
    const invite = pendingInvites.find((i) => i.boardId === boardId);
    const role = invite?.role || 'member';

    // upsert-like behavior to avoid duplicate error
    const { error } = await supabaseAdmin
      .from("board_members")
      .upsert(
        {
          board_id: boardId,
          user_id: userId,
          role,
        },
        {
          onConflict: "board_id,user_id",
          ignoreDuplicates: true,
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Clear invitation metadata
    await fetch(new URL("/api/invitations/respond", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, action: "accept" }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to accept invite.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

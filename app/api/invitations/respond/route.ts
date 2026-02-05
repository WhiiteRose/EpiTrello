import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

  const { boardId } = body as {
    boardId?: string;
    action?: "accept" | "decline";
  };
  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const currentInvites =
      ((user.publicMetadata?.pendingInvites as unknown) as
        | Array<Record<string, unknown>>
        | undefined) ?? [];

    const updated = currentInvites.filter(
      (item) => String(item.boardId) !== String(boardId)
    );
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { pendingInvites: updated },
    });

    return NextResponse.json({ ok: true, invites: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update invitation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

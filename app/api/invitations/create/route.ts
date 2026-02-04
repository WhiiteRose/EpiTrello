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

  const { invitedUserId, boardId, boardTitle, inviterName } = body as {
    invitedUserId?: string;
    boardId?: string;
    boardTitle?: string;
    inviterName?: string | null;
  };

  if (!invitedUserId || !boardId) {
    return NextResponse.json(
      { error: "invitedUserId and boardId are required" },
      { status: 400 }
    );
  }

  try {
    const invitedUser = await clerkClient.users.getUser(invitedUserId);
    const currentInvites =
      ((invitedUser.publicMetadata?.pendingInvites as unknown) as
        | Array<Record<string, unknown>>
        | undefined) ?? [];

    const invite = {
      boardId,
      boardTitle: boardTitle || "Board",
      inviterId: userId,
      inviterName: inviterName || null,
      createdAt: new Date().toISOString(),
    };

    // avoid duplicates
    const updated = [
      ...currentInvites.filter((item) => item.boardId !== boardId),
      invite,
    ];

    await clerkClient.users.updateUserMetadata(invitedUserId, {
      publicMetadata: { pendingInvites: updated },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create invitation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

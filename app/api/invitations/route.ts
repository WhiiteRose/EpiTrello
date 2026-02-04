import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const invites =
      ((user.publicMetadata?.pendingInvites as unknown) as
        | Array<Record<string, unknown>>
        | undefined) ?? [];

    return NextResponse.json({
      invites: invites.map((item) => ({
        boardId: String(item.boardId || ""),
        boardTitle: String(item.boardTitle || "Board"),
        inviterId: item.inviterId ? String(item.inviterId) : null,
        inviterName: item.inviterName ? String(item.inviterName) : null,
        createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch invitations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

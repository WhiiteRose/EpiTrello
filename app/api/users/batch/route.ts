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

  const ids = Array.isArray((body as { ids?: unknown }).ids)
    ? ((body as { ids: unknown[] }).ids as string[])
    : [];

  const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.trim().length > 0)));

  try {
    const users = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const u = await clerkClient.users.getUser(id);
          return {
            id: u.id,
            username: u.username ?? null,
            email:
              u.primaryEmailAddress?.emailAddress ||
              u.emailAddresses?.[0]?.emailAddress ||
              null,
            avatar_url: u.imageUrl || null,
            fullName: u.fullName || null,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ users: users.filter(Boolean) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

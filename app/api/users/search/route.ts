import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const limit =
    Number.parseInt(searchParams.get("limit") || "", 10) || 20;
  const pageSize = Math.min(Math.max(limit, 1), 50);

  try {
    const result = await clerkClient.users.getUserList({
      limit: pageSize,
    });

    const users =
      result?.data
        ?.map((u) => ({
          id: u.id,
          username: u.username ?? null,
          fullName: u.fullName || null,
          email:
            u.primaryEmailAddress?.emailAddress ||
            u.emailAddresses?.[0]?.emailAddress ||
            null,
          avatar_url: u.imageUrl || null,
        }))
        .filter((user) => {
          if (!query) return true;
          const haystacks = [
            user.username?.toLowerCase() ?? "",
            user.email?.toLowerCase() ?? "",
          ];
          return haystacks.some((val) => val.includes(query));
        }) ?? [];

    return NextResponse.json({ users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load users.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

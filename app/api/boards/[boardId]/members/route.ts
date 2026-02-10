import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const { userId } = auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = params;

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { memberId, role } = body;

        if (!memberId || !role) {
            return NextResponse.json({ error: "Missing memberId or role" }, { status: 400 });
        }

        if (!['viewer', 'member', 'owner'].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // verification: User must be owner of the board to change roles
        const { data: board } = await supabaseAdmin
            .from("boards")
            .select("user_id")
            .eq("id", boardId)
            .single();

        if (!board || board.user_id !== userId) {
            console.log("Update Role Failed: User is not owner", { boardOwner: board?.user_id, userId });
            return NextResponse.json({ error: "Forbidden: Only board owner can change roles" }, { status: 403 });
        }

        // update role
        console.log("Updating role", { memberId, role, boardId });
        const { error } = await supabaseAdmin
            .from("board_members")
            .update({ role })
            .eq("id", memberId)
            .select('*');

        if (error) {
            console.error("Update Role DB Error:", error);
            throw error;
        }


        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to update member role", error);
        return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
    }
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
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
        const { newOwnerId, memberRecordId } = body;

        if (!newOwnerId || !memberRecordId) {
            return NextResponse.json({ error: "Missing newOwnerId or memberRecordId" }, { status: 400 });
        }

        // Verify: Current user must be the board owner
        const { data: board } = await supabaseAdmin
            .from("boards")
            .select("user_id")
            .eq("id", boardId)
            .single();

        if (!board || board.user_id !== userId) {
            return NextResponse.json({ error: "Forbidden: Only board owner can transfer ownership" }, { status: 403 });
        }

        // Step 1: Update the board's user_id to the new owner
        const { error: boardUpdateError } = await supabaseAdmin
            .from("boards")
            .update({ user_id: newOwnerId, updated_at: new Date().toISOString() })
            .eq("id", boardId);

        if (boardUpdateError) throw boardUpdateError;

        // Step 2: Remove the new owner from board_members table (they're now the board owner)
        const { error: removeMemberError } = await supabaseAdmin
            .from("board_members")
            .delete()
            .eq("id", memberRecordId)
            .eq("board_id", boardId);

        if (removeMemberError) throw removeMemberError;

        // Step 3: Add the previous owner as a regular member
        const { error: addMemberError } = await supabaseAdmin
            .from("board_members")
            .insert({
                board_id: boardId,
                user_id: userId,
                external_user_id: userId,
                role: "member"
            });

        if (addMemberError) throw addMemberError;

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to transfer ownership", error);
        return NextResponse.json({ error: "Failed to transfer ownership" }, { status: 500 });
    }
}

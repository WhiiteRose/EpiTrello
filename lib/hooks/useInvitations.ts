import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "../supabase/SupabaseProvider";
import { boardMemberService } from "../services";

export type BoardInvite = {
  boardId: string;
  boardTitle: string;
  inviterId?: string | null;
  inviterName?: string | null;
  createdAt: string;
};

export function useInvitations() {
  const { user, isLoaded } = useUser();
  const { supabase } = useSupabase();
  const [invites, setInvites] = useState<BoardInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    if (!isLoaded) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/invitations");
      if (!res.ok) throw new Error("Failed to load invitations");
      const data = (await res.json()) as { invites: BoardInvite[] };
      setInvites(data.invites || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load invitations."
      );
    } finally {
      setLoading(false);
    }
  }, [isLoaded]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  // Rafraîchissement périodique pour voir les notifications sans rechargement
  useEffect(() => {
    if (!isLoaded) return;
    const id = setInterval(() => {
      loadInvites();
    }, 5000);
    return () => clearInterval(id);
  }, [isLoaded, loadInvites]);

  // Rafraîchir à chaque retour de focus
  useEffect(() => {
    if (!isLoaded) return;
    const handler = () => loadInvites();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [isLoaded, loadInvites]);

  async function acceptInvite(invite: BoardInvite) {
    if (!user) return;
    try {
      setError(null);
      setActioningId(invite.boardId);

      if (!supabase) throw new Error("Supabase client not ready.");

      const primaryEmail =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        null;

      const { error } = await supabase.from("board_members").insert({
        board_id: invite.boardId,
        user_id: user.id, // column est en text côté DB
        external_user_id: user.id,
        role: "member",
        user_email: primaryEmail,
      });

      // Ignore duplicate constraint errors
      if (error && !["23505", "PGRST116"].includes(error.code ?? "")) {
        throw error;
      }

      const res = await fetch("/api/invitations/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: invite.boardId, action: "accept" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to clear invitation.");
      }
      // Retrait optimiste immédiat
      setInvites((prev) => prev.filter((i) => i.boardId !== invite.boardId));

      const data = (await res.json()) as { invites?: BoardInvite[] };
      if (data.invites) {
        setInvites(data.invites);
      }

      // Rafraîchir la vue pour faire apparaître le board sans action manuelle
      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation."
      );
    } finally {
      setActioningId(null);
    }
  }

  async function declineInvite(invite: BoardInvite) {
    try {
      setError(null);
      setActioningId(invite.boardId);
      // retrait optimiste
      setInvites((prev) => prev.filter((i) => i.boardId !== invite.boardId));
      const res = await fetch("/api/invitations/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: invite.boardId, action: "decline" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to decline invitation.");
      }
      const data = (await res.json()) as { invites?: BoardInvite[] };
      if (data.invites) setInvites(data.invites);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to decline invitation."
      );
    } finally {
      setActioningId(null);
    }
  }

  return {
    invites,
    loading,
    error,
    actioningId,
    acceptInvite,
    declineInvite,
    reload: loadInvites,
  };
}

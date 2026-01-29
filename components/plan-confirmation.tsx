"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type ConfirmPlanBannerProps = {
  sessionId?: string;
};

export function ConfirmPlanBanner({ sessionId }: ConfirmPlanBannerProps) {
  const [status, setStatus] = useState<"pending" | "done" | "error">("pending");
  const [message, setMessage] = useState<string>(
    "Validation de votre abonnement…"
  );

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId) {
        setStatus("error");
        setMessage("Aucune session Stripe trouvée, mais le paiement a bien été reçu.");
        return;
      }
      try {
        const res = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error ?? "Impossible de confirmer l'abonnement.");
          return;
        }
        setStatus("done");
        setMessage("Abonnement confirmé, vous pouvez créer des tableaux illimités.");
      } catch {
        setStatus("error");
        setMessage("Impossible de confirmer l'abonnement.");
      }
    };

    confirm();
  }, [sessionId]);

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <span>{message}</span>
    </div>
  );
}

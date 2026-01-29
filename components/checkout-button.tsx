"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type CheckoutButtonProps = {
  plan: "pro" | "enterprise";
  label: string;
  successPath?: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function CheckoutButton({
  plan,
  label,
  successPath = "/dashboard",
  disabled = false,
  disabledReason,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, successPath }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error ?? "Impossible de démarrer le paiement Stripe.";
        setError(message);
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        setError("Lien de paiement manquant.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button className="w-full" onClick={handleClick} disabled={disabled || loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
      </Button>
      {(disabledReason || error) && (
        <p className="mt-2 text-xs text-red-500">{disabledReason ?? error}</p>
      )}
    </div>
  );
}

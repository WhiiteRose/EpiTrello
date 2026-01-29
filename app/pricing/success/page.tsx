import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmPlanBanner } from "@/components/plan-confirmation";

type PricingSuccessPageProps = {
  searchParams: {
    session_id?: string;
  };
};

export default function PricingSuccessPage({
  searchParams,
}: PricingSuccessPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white shadow-md rounded-lg p-6 sm:p-10 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Paiement confirmé
        </h1>
        <p className="text-gray-600">
          Merci ! Votre abonnement est activé. Si vous ne voyez pas les
          fonctionnalités Pro immédiatement, attendez quelques secondes puis
          rechargez le tableau de bord.
        </p>
        <Suspense
          fallback={
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validation de votre abonnement…</span>
            </div>
          }
        >
          <ConfirmPlanBanner sessionId={searchParams.session_id} />
        </Suspense>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
          >
            Retourner au dashboard
          </Link>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirection après le paiement…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

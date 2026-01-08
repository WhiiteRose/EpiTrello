import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PricingTableProps = {
  newSubscriptionRedirectUrl?: string;
};

const plans = [
  {
    name: "Free",
    price: "0 EUR",
    description: "Pour essayer l'app",
    features: ["1 tableau", "Collaboration de base", "Support communautaire"],
    cta: "Commencer",
    highlight: false,
    key: "free",
  },
  {
    name: "Pro",
    price: "12 EUR",
    description: "Pour les equipes qui avancent vite",
    features: [
      "Tableaux illimites",
      "Historique d'activite",
      "Support prioritaire",
    ],
    cta: "Passer en Pro",
    highlight: true,
    key: "pro",
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    description: "Pour les besoins avances",
    features: [
      "SLA et support dedie",
      "SSO/SAML",
      "Facturation centralisee",
    ],
    cta: "Nous contacter",
    highlight: false,
    key: "enterprise",
  },
];

export function PricingTable({ newSubscriptionRedirectUrl }: PricingTableProps) {
  const fallbackHref = newSubscriptionRedirectUrl ?? "/dashboard";
  const proCheckoutUrl = process.env.NEXT_PUBLIC_BILLING_PRO_URL;
  const enterpriseCheckoutUrl = process.env.NEXT_PUBLIC_BILLING_ENTERPRISE_URL;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const checkoutUrl =
          plan.key === "pro"
            ? proCheckoutUrl
            : plan.key === "enterprise"
            ? enterpriseCheckoutUrl
            : fallbackHref;
        const needsSetup = plan.key !== "free" && !checkoutUrl;

        return (
        <Card
          key={plan.name}
          className={plan.highlight ? "border-primary shadow-md" : undefined}
        >
          <CardHeader>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">{plan.price}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {plan.key === "free" ? (
              <Button asChild className="w-full">
                <Link href={fallbackHref}>{plan.cta}</Link>
              </Button>
            ) : checkoutUrl ? (
              <Button asChild className="w-full">
                <Link href={checkoutUrl}>{plan.cta}</Link>
              </Button>
            ) : (
              <Button className="w-full" disabled>
                Indisponible
              </Button>
            )}
          </CardFooter>
          {needsSetup && (
            <CardFooter className="pt-0">
              <p className="text-xs text-muted-foreground">
                Configure{" "}
                {plan.key === "pro"
                  ? "NEXT_PUBLIC_BILLING_PRO_URL"
                  : "NEXT_PUBLIC_BILLING_ENTERPRISE_URL"}
              </p>
            </CardFooter>
          )}
        </Card>
        );
      })}
    </div>
  );
}

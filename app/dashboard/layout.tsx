import { PlanProvider } from '@/lib/contexts/PlanContext';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { has } = await auth();
  const hasProPlan = has({ plan: 'pro_user' });
  const hasEntreprisePlan = has({ plan: 'entreprise_user' });
  return (
    <PlanProvider hasProPlan={hasProPlan} hasEntreprisePlan={hasEntreprisePlan}>
      {children}
    </PlanProvider>
  );
}

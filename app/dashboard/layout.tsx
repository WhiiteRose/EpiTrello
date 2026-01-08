import { PlanProvider } from '@/lib/contexts/PlanContext';
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { has } = await auth();
  const hasProPlan = has({ permission: 'pro_user' });
  const hasEntreprisePlan = has({ permission: 'entreprise_user' });
  return (
    <PlanProvider hasProPlan={hasProPlan} hasEntreprisePlan={hasEntreprisePlan}>
      {children}
    </PlanProvider>
  );
}

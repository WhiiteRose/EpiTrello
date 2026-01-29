import { PlanProvider } from '@/lib/contexts/PlanContext';
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { has } = await auth();
  const user = await currentUser();
  const planFromMetadata = (user?.publicMetadata?.plan as string | undefined)?.toLowerCase();
  const hasProPlan = has({ permission: 'pro_user' }) || planFromMetadata === 'pro';
  const hasEntreprisePlan =
    has({ permission: 'entreprise_user' }) || planFromMetadata === 'enterprise';
  return (
    <PlanProvider hasProPlan={hasProPlan} hasEntreprisePlan={hasEntreprisePlan}>
      {children}
    </PlanProvider>
  );
}

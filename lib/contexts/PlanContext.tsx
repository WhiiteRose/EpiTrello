'use client';
import { createContext, useContext } from 'react';
interface PlanContextType {
  isFreeUser: boolean;
  hasProPlan: boolean;
  hasEntreprisePlan: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

interface PlanProviderProps {
  children: React.ReactNode;
  hasProPlan: boolean;
  hasEntreprisePlan: boolean;
}

export function PlanProvider({ children, hasProPlan, hasEntreprisePlan }: PlanProviderProps) {
  return (
    <PlanContext.Provider
      value={{ hasProPlan, hasEntreprisePlan, isFreeUser: !hasProPlan && !hasEntreprisePlan }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan needs to be inside the provider');
  }
  return context;
};

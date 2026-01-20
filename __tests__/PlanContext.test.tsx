import { render, screen } from "@testing-library/react";
import { PlanProvider, usePlan } from "@/lib/contexts/PlanContext";

function PlanTester() {
  const { isFreeUser, hasProPlan, hasEntreprisePlan } = usePlan();
  return (
    <div data-testid="plan">
      {`${isFreeUser}-${hasProPlan}-${hasEntreprisePlan}`}
    </div>
  );
}

describe("PlanProvider", () => {
  it("throws when used outside provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<PlanTester />)).toThrow(
      "usePlan needs to be inside the provider"
    );

    consoleError.mockRestore();
  });

  it("marks free users when no plan is active", () => {
    render(
      <PlanProvider hasProPlan={false} hasEntreprisePlan={false}>
        <PlanTester />
      </PlanProvider>
    );

    expect(screen.getByTestId("plan")).toHaveTextContent("true-false-false");
  });

  it("marks pro users as not free", () => {
    render(
      <PlanProvider hasProPlan={true} hasEntreprisePlan={false}>
        <PlanTester />
      </PlanProvider>
    );

    expect(screen.getByTestId("plan")).toHaveTextContent("false-true-false");
  });
});

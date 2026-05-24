// @vitest-environment jsdom
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
import { describe, expect, it } from "vitest";
import { PlanPanel } from "./PlanPanel";

describe("PlanPanel", () => {
  it("shows a waiting label while processing without a plan", () => {
    render(<PlanPanel plan={null} isProcessing />);

    expect(screen.getByText("waitingOnPlan")).toBeTruthy();
  });

  it("shows an empty label when idle without a plan", () => {
    render(<PlanPanel plan={null} isProcessing={false} />);

    expect(screen.getByText("noActivePlan")).toBeTruthy();
  });
});

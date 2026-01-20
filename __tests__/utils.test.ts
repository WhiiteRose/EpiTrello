import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges classnames and resolves conflicts", () => {
    expect(cn("px-2", "px-4", "text-sm", { "font-bold": true })).toBe(
      "px-4 text-sm font-bold"
    );
  });
});

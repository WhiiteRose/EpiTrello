import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/lib/contexts/ThemeContext";

function ThemeTester() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme} data-testid="toggle">
      {theme}
    </button>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  it("throws when used outside provider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<ThemeTester />)).toThrow(
      "useTheme must be used within ThemeProvider"
    );

    consoleError.mockRestore();
  });

  it("uses the stored theme on load", async () => {
    localStorage.setItem("epitrello-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("toggle")).toHaveTextContent("dark")
    );
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("toggles theme and persists preference", async () => {
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("toggle")).toHaveTextContent("light")
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("toggle"));

    await waitFor(() =>
      expect(screen.getByTestId("toggle")).toHaveTextContent("dark")
    );
    expect(localStorage.getItem("epitrello-theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});

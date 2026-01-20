import { render, screen } from "@testing-library/react";
import NavBar from "@/components/navbar";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";

const mockUseUser = jest.fn();
const mockUsePathname = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  __esModule: true,
  useUser: () => mockUseUser(),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in">{children}</div>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-up">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button" />,
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  usePathname: () => mockUsePathname(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("NavBar", () => {
  beforeEach(() => {
    mockUseUser.mockReset();
    mockUsePathname.mockReset();
  });

  it("shows auth actions on public pages when signed out", () => {
    mockUsePathname.mockReturnValue("/");
    mockUseUser.mockReturnValue({ isSignedIn: false, user: null });

    renderWithTheme(<NavBar />);

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i })
    ).toBeInTheDocument();
  });

  it("shows the user menu on dashboard", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseUser.mockReturnValue({
      isSignedIn: true,
      user: { firstName: "Tom", emailAddresses: [{ emailAddress: "tom@x.com" }] },
    });

    renderWithTheme(<NavBar />);

    expect(screen.getByTestId("user-button")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
  });

  it("renders board title and filter badge on board pages", () => {
    mockUsePathname.mockReturnValue("/boards/123");
    mockUseUser.mockReturnValue({ isSignedIn: true, user: null });

    renderWithTheme(
      <NavBar boardTitle="Project Atlas" onFilterClick={() => {}} filterCount={2} />
    );

    expect(screen.getByText("Project Atlas")).toBeInTheDocument();
    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

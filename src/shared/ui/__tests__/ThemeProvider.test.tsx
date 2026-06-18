// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, renderHook } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/shared/ui/ThemeProvider";

const STORAGE_KEY = "hospital-theme";

function TestConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="set-light-btn" onClick={() => setTheme("light")}>
        Set Light
      </button>
      <button data-testid="set-dark-btn" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    cleanup();
    // Reset localStorage mock
    localStorage.clear();
    // Default: no stored preference, light system preference
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    // Reset document classList
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should default to light theme when no localStorage and prefers-light", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
  });

  it("should read stored theme from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });

  it("should add dark class to html element when dark theme", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    renderWithProvider(<TestConsumer />);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("should toggle theme from light to dark", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("theme-value").textContent).toBe("light");

    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });

  it("should toggle theme from dark to light", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");

    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
  });

  it("should persist toggle to localStorage", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("should set theme to light explicitly", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-light-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("should set theme to dark explicitly", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("set-dark-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("should remove dark class when toggling back to light", () => {
    renderWithProvider(<TestConsumer />);
    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("should fallback to dark when prefers-color-scheme: dark", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });

  it("should ignore invalid localStorage values and fallback", () => {
    localStorage.setItem(STORAGE_KEY, "invalid-theme");
    renderWithProvider(<TestConsumer />);
    // Should fallback to light (matchMedia returns matches: false)
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
  });

  it("should add event listener for system preference changes", () => {
    const addEventListenerMock = vi.fn();
    const removeEventListenerMock = vi.fn();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderWithProvider(<TestConsumer />);
    expect(addEventListenerMock).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should render children content", () => {
    renderWithProvider(<div data-testid="child">Child Content</div>);
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Child Content")).toBeDefined();
  });

  it("should useTheme export working context value", () => {
    function CheckContext() {
      const ctx = useTheme();
      return (
        <span data-testid="context-has-toggle">
          {typeof ctx.toggleTheme === "function" ? "yes" : "no"}
        </span>
      );
    }
    renderWithProvider(<CheckContext />);
    expect(screen.getByTestId("context-has-toggle").textContent).toBe("yes");
  });

  it("should handle multiple toggle cycles", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("theme-value").textContent).toBe("light");

    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");

    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("light");

    fireEvent.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });
});

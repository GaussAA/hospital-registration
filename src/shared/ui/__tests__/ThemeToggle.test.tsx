// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ThemeToggle from "@/shared/ui/ThemeToggle";

// Need to mock useTheme from ThemeProvider
const mockToggleTheme = vi.fn();
let mockTheme = "light";

vi.mock("@/shared/ui/ThemeProvider", () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
    setTheme: vi.fn(),
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    cleanup();
    mockTheme = "light";
    mockToggleTheme.mockClear();
  });

  it("should render a button element", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeDefined();
  });

  it("should have aria-label for light mode when mounted with light theme", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("切换深色模式");
  });

  it("should have aria-label for dark mode when mounted with dark theme", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("切换浅色模式");
  });

  it("should have correct title for light theme", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("title")).toBe("深色模式");
  });

  it("should have correct title for dark theme", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("title")).toBe("浅色模式");
  });

  it("should call toggleTheme when clicked", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("should render sun and moon SVG icons", () => {
    const { container } = render(<ThemeToggle />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2);
  });

  it("should show sun icon visible in dark mode", () => {
    mockTheme = "dark";
    const { container } = render(<ThemeToggle />);
    const sunPath = container.querySelector("path[d*='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364']");
    expect(sunPath).toBeDefined();
  });

  it("should show moon icon visible in light mode", () => {
    const { container } = render(<ThemeToggle />);
    const moonPath = container.querySelector("path[d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z']");
    expect(moonPath).toBeDefined();
  });

  it("should have hover and click styles class", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:bg-[var(--bg-hover)]");
    expect(button.className).toContain("active:scale-95");
  });

  it("should have relative positioning for icon layering", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("relative");
  });
});

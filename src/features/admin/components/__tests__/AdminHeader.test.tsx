// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminHeader from "../AdminHeader";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe("AdminHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the admin title", () => {
    render(<AdminHeader />);
    expect(screen.getByText("管理后台")).toBeDefined();
  });

  it("should render a link back to the homepage", () => {
    render(<AdminHeader />);
    const link = screen.getByText("返回前台");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/");
  });
});

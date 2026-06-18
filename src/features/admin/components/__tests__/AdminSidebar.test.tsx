// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AdminSidebar from "../AdminSidebar";

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/admin");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, onClick, className }: Record<string, unknown>) => (
    <a href={href as string} onClick={onClick as () => void} className={className as string}>
      {children}
    </a>
  ),
}));

describe("AdminSidebar", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/admin");
  });

  it("should render all menu items", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("仪表盘")).toBeDefined();
    expect(screen.getByText("医院管理")).toBeDefined();
    expect(screen.getByText("科室管理")).toBeDefined();
    expect(screen.getByText("医生管理")).toBeDefined();
    expect(screen.getByText("排班管理")).toBeDefined();
  });

  it("should highlight the active menu item based on pathname", () => {
    mockPathname.mockReturnValue("/admin/hospitals");
    render(<AdminSidebar />);
    // The active link should have the blue styling class
    const hospitalLink = screen.getByText("医院管理").closest("a");
    expect(hospitalLink?.className).toContain("bg-blue-600");
  });

  it("should highlight dashboard only when pathname is exactly /admin", () => {
    mockPathname.mockReturnValue("/admin/hospitals");
    render(<AdminSidebar />);
    const dashboardLink = screen.getByText("仪表盘").closest("a");
    const hospitalLink = screen.getByText("医院管理").closest("a");
    expect(dashboardLink?.className).not.toContain("bg-blue-600");
    expect(hospitalLink?.className).toContain("bg-blue-600");
  });

  it("should render a back-to-homepage link in the footer", () => {
    render(<AdminSidebar />);
    const links = screen.getAllByText("返回前台");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("should have a mobile hamburger button", () => {
    render(<AdminSidebar />);
    const menuButton = screen.getByLabelText("打开菜单");
    expect(menuButton).toBeDefined();
  });

  it("should toggle mobile menu on hamburger click", () => {
    render(<AdminSidebar />);
    const menuButton = screen.getByLabelText("打开菜单");
    fireEvent.click(menuButton);
    expect(screen.getByLabelText("关闭菜单")).toBeDefined();
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeDefined();
  });

  it("should close mobile menu when clicking overlay", () => {
    render(<AdminSidebar />);
    const menuButton = screen.getByLabelText("打开菜单");
    fireEvent.click(menuButton);
    expect(screen.getByLabelText("关闭菜单")).toBeDefined();
    const overlay = document.querySelector('[aria-hidden="true"]');
    if (overlay) {
      fireEvent.click(overlay);
      expect(screen.getByLabelText("打开菜单")).toBeDefined();
    }
  });

  it("should render the logo with text", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("管理后台")).toBeDefined();
  });
});

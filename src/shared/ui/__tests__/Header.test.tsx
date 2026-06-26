// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import Header from "@/shared/ui/Header";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock ThemeToggle to avoid needing ThemeProvider context
vi.mock("@/shared/ui/ThemeToggle", () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}));

// Mock useUser from auth client
let mockUser: { id: string; name: string; role: string } | null = null;
vi.mock("@/features/auth/client", () => ({
  useUser: () => ({ user: mockUser }),
}));

describe("Header", () => {
  beforeEach(() => {
    cleanup();
    mockPathname = "/";
    mockUser = null;
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  describe("navigation links", () => {
    it("should render all navigation links", () => {
      render(<Header />);
      expect(screen.getByText("首页")).toBeDefined();
      expect(screen.getByText("医院")).toBeDefined();
      expect(screen.getByText("我的挂号")).toBeDefined();
    });

    it("should render logo with brand name", () => {
      render(<Header />);
      expect(screen.getByText("健康挂号")).toBeDefined();
    });

    it("should render logo as a link to home", () => {
      render(<Header />);
      const logoLink = screen.getByText("健康挂号").closest("a");
      expect(logoLink?.getAttribute("href")).toBe("/");
    });

    it("should highlight active link based on current pathname", () => {
      mockPathname = "/hospitals";
      render(<Header />);
      const hospitalsLink = screen.getByText("医院").closest("a");
      expect(hospitalsLink?.className).toContain("bg-blue-50");
    });

    it("should highlight nested path matches", () => {
      mockPathname = "/appointments/123";
      render(<Header />);
      const appointmentsLink = screen.getByText("我的挂号").closest("a");
      expect(appointmentsLink?.className).toContain("bg-blue-50");
    });

    it("should not highlight home link for sub-paths", () => {
      mockPathname = "/hospitals";
      render(<Header />);
      const homeLink = screen.getByText("首页").closest("a");
      expect(homeLink?.className).not.toContain("bg-blue-50");
    });
  });

  describe("authentication state", () => {
    it("should show login and register buttons when user is not logged in", () => {
      render(<Header />);
      expect(screen.getByText("登录")).toBeDefined();
      expect(screen.getByText("注册")).toBeDefined();
      expect(screen.queryByText("退出")).toBeNull();
    });

    it("should show user name and logout button when user is logged in", () => {
      mockUser = { id: "1", name: "张三", role: "user" };
      render(<Header />);
      expect(screen.getByText("张三")).toBeDefined();
      expect(screen.getByText("退出")).toBeDefined();
      expect(screen.queryByText("登录")).toBeNull();
      expect(screen.queryByText("注册")).toBeNull();
    });

    it("should link user name to appointments for non-admin users", () => {
      mockUser = { id: "1", name: "张三", role: "user" };
      render(<Header />);
      const userLink = screen.getByText("张三").closest("a");
      expect(userLink?.getAttribute("href")).toBe("/appointments");
    });

    it("should link user name to admin for admin users", () => {
      mockUser = { id: "1", name: "管理员", role: "admin" };
      render(<Header />);
      const userLink = screen.getByText("管理员").closest("a");
      expect(userLink?.getAttribute("href")).toBe("/admin");
    });
  });

  describe("logout", () => {
    it("should call fetch and router.push when logging out", async () => {
      mockUser = { id: "1", name: "张三", role: "user" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
      });
      vi.stubGlobal("fetch", mockFetch);

      render(<Header />);
      fireEvent.click(screen.getByText("退出"));

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout");
      // Wait for the async handler
      await vi.waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });

      vi.unstubAllGlobals();
    });

    it("should handle logout failure gracefully", async () => {
      mockUser = { id: "1", name: "张三", role: "user" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      vi.stubGlobal("fetch", mockFetch);

      render(<Header />);
      fireEvent.click(screen.getByText("退出"));

      await vi.waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });

      vi.unstubAllGlobals();
    });

    it("should handle network error on logout", async () => {
      mockUser = { id: "1", name: "张三", role: "user" };
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.stubGlobal("fetch", mockFetch);

      render(<Header />);
      fireEvent.click(screen.getByText("退出"));

      await vi.waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });

      vi.unstubAllGlobals();
    });
  });

  describe("theme toggle", () => {
    it("should render ThemeToggle component", () => {
      render(<Header />);
      expect(screen.getByTestId("theme-toggle")).toBeDefined();
    });
  });

  describe("login/register links", () => {
    it("should link login to /auth/login", () => {
      render(<Header />);
      const loginLink = screen.getByText("登录").closest("a");
      expect(loginLink?.getAttribute("href")).toBe("/login");
    });

    it("should link register to /auth/register", () => {
      render(<Header />);
      const registerLink = screen.getByText("注册").closest("a");
      expect(registerLink?.getAttribute("href")).toBe("/register");
    });
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../LoginForm";

const mockPush = vi.fn();
const mockSetUser = vi.fn();
let mockAccount = "";
let mockPassword = "";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: mockPush })) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

vi.mock("../UserProvider", () => ({
  useUser: vi.fn(() => ({ setUser: mockSetUser })),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockAccount = "";
  mockPassword = "";
});

function setup() {
  return render(<LoginForm />);
}

describe("LoginForm", () => {
  it("renders the form with account and password inputs", () => {
    setup();
    expect(screen.getByLabelText("邮箱 / 手机号")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /登录/ })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /登录/ }));

    expect(screen.getByText("请输入邮箱或手机号")).toBeInTheDocument();
    expect(screen.getByText("请输入密码")).toBeInTheDocument();
  });

  it("clears field error after user types", async () => {
    const user = userEvent.setup();
    setup();

    // Submit empty to trigger errors
    await user.click(screen.getByRole("button", { name: /登录/ }));
    expect(screen.getByText("请输入邮箱或手机号")).toBeInTheDocument();

    // Type to clear the error
    const accountInput = screen.getByLabelText("邮箱 / 手机号");
    await user.type(accountInput, "test@example.com");

    expect(screen.queryByText("请输入邮箱或手机号")).not.toBeInTheDocument();
  });

  it("calls setUser and router.push on successful login", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, data: { user: { id: "1", name: "Test" } } }),
    });

    setup();

    await user.type(screen.getByLabelText("邮箱 / 手机号"), "admin@test.com");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.click(screen.getByRole("button", { name: /登录/ }));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({ id: "1", name: "Test" });
    });
    expect(mockPush).toHaveBeenCalledWith("/hospitals");
  });

  it("displays server error message on login failure", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 1, message: "账号或密码错误" }),
    });

    setup();

    await user.type(screen.getByLabelText("邮箱 / 手机号"), "admin@test.com");
    await user.type(screen.getByLabelText("密码"), "wrong");
    await user.click(screen.getByRole("button", { name: /登录/ }));

    await waitFor(() => {
      expect(screen.getByText("账号或密码错误")).toBeInTheDocument();
    });
  });

  it("displays network error message on fetch failure", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    setup();

    await user.type(screen.getByLabelText("邮箱 / 手机号"), "admin@test.com");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.click(screen.getByRole("button", { name: /登录/ }));

    await waitFor(() => {
      expect(screen.getByText("网络错误，请稍后重试")).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise!: (value: unknown) => void;
    mockFetch.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    setup();

    await user.type(screen.getByLabelText("邮箱 / 手机号"), "admin@test.com");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.click(screen.getByRole("button", { name: /登录/ }));

    expect(screen.getByText("登录中...")).toBeInTheDocument();

    resolvePromise({ ok: true, json: async () => ({ code: 0, data: { user: { id: "1" } } }) });
    await waitFor(() => {
      expect(screen.queryByText("登录中...")).not.toBeInTheDocument();
    });
  });

  it("shows password validation error for short password", async () => {
    const user = userEvent.setup();
    setup();

    const passwordInput = screen.getByLabelText("密码");
    await user.type(passwordInput, "12");
    // Trigger blur
    await user.click(screen.getByRole("button", { name: /登录/ }));

    expect(screen.getByText("密码至少 6 位")).toBeInTheDocument();
  });

  it("renders register link", () => {
    setup();
    const link = screen.getByText("立即注册");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/register");
  });
});

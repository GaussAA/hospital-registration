// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../RegisterForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: mockPush })) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

function setup() {
  return render(<RegisterForm />);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, overrides?: { email?: string; phone?: string }) {
  await user.type(screen.getByLabelText("姓名"), "张三");
  await user.type(screen.getByLabelText("邮箱"), overrides?.email ?? "test@example.com");
  if (overrides?.phone) {
    await user.type(screen.getByLabelText("手机号"), overrides.phone);
  }
  await user.type(screen.getByLabelText("密码"), "password123");
  await user.type(screen.getByLabelText("确认密码"), "password123");
}

describe("RegisterForm", () => {
  it("renders all form fields", () => {
    setup();
    expect(screen.getByLabelText("姓名")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("手机号")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument();
  });

  it("shows name validation on empty submit", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("请输入姓名")).toBeInTheDocument();
  });

  it("shows name too short error", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("姓名"), "A");
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("姓名至少 2 个字符")).toBeInTheDocument();
  });

  it("requires at least email or phone", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("姓名"), "张三");
    await user.type(screen.getByLabelText("密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "password123");
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("邮箱和手机号至少填一项")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("邮箱"), "invalid-email");
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("邮箱格式不正确")).toBeInTheDocument();
  });

  it("validates phone format", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("手机号"), "12345");
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("手机号格式不正确（11位数字）")).toBeInTheDocument();
  });

  it("validates password length", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("密码"), "12");
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("密码至少 6 位")).toBeInTheDocument();
  });

  it("validates confirm password match", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("密码"), "password123");
    await user.type(screen.getByLabelText("确认密码"), "different");
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("两次密码输入不一致")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    setup();

    const passwordInput = screen.getByLabelText("密码");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Find the toggle button inside the password field
    const toggleButtons = screen.getAllByRole("button");
    // The password toggle is the first toggle button in the form (not submit)
    const pwdToggle = toggleButtons[0];
    await user.click(pwdToggle);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("toggles confirm password visibility", async () => {
    const user = userEvent.setup();
    setup();

    const confirmInput = screen.getByLabelText("确认密码");
    expect(confirmInput).toHaveAttribute("type", "password");

    const toggleButtons = screen.getAllByRole("button");
    const confirmToggle = toggleButtons[1];
    await user.click(confirmToggle);

    expect(confirmInput).toHaveAttribute("type", "text");
  });

  it("submits successfully with email only", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0 }),
    });

    setup();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?registered=1");
    });
  });

  it("submits successfully with phone only", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0 }),
    });

    setup();
    await fillRequiredFields(user, { email: "", phone: "13800138000" });
    await user.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?registered=1");
    });
  });

  it("displays server error on failed registration", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ code: 1, message: "该邮箱已被注册" }),
    });

    setup();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(screen.getByText("该邮箱已被注册")).toBeInTheDocument();
    });
  });

  it("displays network error on fetch failure", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    setup();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "注册" }));

    await waitFor(() => {
      expect(screen.getByText("网络错误，请稍后重试")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    let resolvePromise!: (value: unknown) => void;
    mockFetch.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    setup();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByText("注册中...")).toBeInTheDocument();

    resolvePromise({ ok: true, json: async () => ({ code: 0 }) });
    await waitFor(() => {
      expect(screen.queryByText("注册中...")).not.toBeInTheDocument();
    });
  });

  it("renders login link", () => {
    setup();
    const link = screen.getByText("去登录");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });
});

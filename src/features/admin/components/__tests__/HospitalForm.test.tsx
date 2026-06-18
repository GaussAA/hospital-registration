// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HospitalForm from "../HospitalForm";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })), usePathname: vi.fn(() => "/admin") }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const mockOnSave = vi.fn<() => Promise<void>>();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(props?: Partial<React.ComponentProps<typeof HospitalForm>>) {
  return render(
    <HospitalForm
      onSave={mockOnSave}
      onCancel={mockOnCancel}
      {...props}
    />,
  );
}

describe("HospitalForm", () => {
  it("renders all required fields", () => {
    setup();
    expect(screen.getByText("医院名称")).toBeInTheDocument();
    expect(screen.getByText("所在城市")).toBeInTheDocument();
    expect(screen.getByText("医院等级")).toBeInTheDocument();
    expect(screen.getByText("联系电话")).toBeInTheDocument();
    expect(screen.getByText("医院地址")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("shows all 4 validation errors on empty submit", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByText("请输入医院名称")).toBeInTheDocument();
    expect(screen.getByText("请输入所在城市")).toBeInTheDocument();
    expect(screen.getByText("请输入联系电话")).toBeInTheDocument();
    expect(screen.getByText("请输入医院地址")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("calls onSave with form data on valid submit", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce();
    setup();

    await user.type(screen.getByPlaceholderText("请输入医院名称"), "市人民医院");
    await user.type(screen.getByPlaceholderText("请输入城市"), "北京");
    await user.type(screen.getByPlaceholderText("请输入电话"), "010-12345678");
    await user.type(screen.getByPlaceholderText("请输入地址"), "北京市中心");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "市人民医院",
          city: "北京",
          phone: "010-12345678",
          address: "北京市中心",
        }),
      );
    });
  });

  it("pre-fills initialData", () => {
    setup({
      initialData: {
        name: "测试医院",
        city: "上海",
        level: "三乙",
        phone: "021-87654321",
        address: "上海市区",
      },
    });

    expect((screen.getByPlaceholderText("请输入医院名称") as HTMLInputElement).value).toBe("测试医院");
    expect((screen.getByPlaceholderText("请输入城市") as HTMLInputElement).value).toBe("上海");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("三乙");
  });

  it("has level select with all options", () => {
    setup();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent("三甲");
    expect(options[1]).toHaveTextContent("三乙");
    expect(options[2]).toHaveTextContent("二甲");
    expect(options[3]).toHaveTextContent("二乙");
    expect(options[4]).toHaveTextContent("一级");
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when saving", () => {
    setup({ saving: true });
    expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
  });

  it("clears individual field errors on type", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请输入医院名称")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("请输入医院名称"), "新医院");
    expect(screen.queryByText("请输入医院名称")).not.toBeInTheDocument();
    // Other errors should remain if not fixed
    expect(screen.getByText("请输入所在城市")).toBeInTheDocument();
  });
});

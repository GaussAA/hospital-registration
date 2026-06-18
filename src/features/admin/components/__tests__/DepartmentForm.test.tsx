// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DepartmentForm from "../DepartmentForm";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })), usePathname: vi.fn(() => "/admin") }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const mockOnSave = vi.fn<() => Promise<void>>();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(props?: Partial<React.ComponentProps<typeof DepartmentForm>>) {
  return render(
    <DepartmentForm
      hospitalId="hospital-1"
      onSave={mockOnSave}
      onCancel={mockOnCancel}
      {...props}
    />,
  );
}

describe("DepartmentForm", () => {
  it("renders form fields and buttons", () => {
    setup();
    expect(screen.getByText("科室名称")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("shows validation error when name is empty on submit", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请输入科室名称")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("calls onSave with form data on valid submit", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce();
    setup();

    await user.type(screen.getByPlaceholderText("请输入科室名称"), "内科");
    await user.type(screen.getByPlaceholderText("请输入科室描述"), "内科科室描述");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: "内科",
        description: "内科科室描述",
      });
    });
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("pre-fills form data from initialData", () => {
    setup({
      initialData: { name: "外科", description: "外科科室" },
    });
    const input = screen.getByPlaceholderText("请输入科室名称") as HTMLInputElement;
    expect(input.value).toBe("外科");
  });

  it("disables buttons when saving", () => {
    setup({ saving: true });
    expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
  });

  it("clears name error when user types after validation", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请输入科室名称")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("请输入科室名称"), "儿科");
    expect(screen.queryByText("请输入科室名称")).not.toBeInTheDocument();
  });

  it("contains hidden hospitalId input", () => {
    setup();
    const hiddenInput = document.querySelector('input[name="hospitalId"]') as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput.value).toBe("hospital-1");
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DoctorForm from "../DoctorForm";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })), usePathname: vi.fn(() => "/admin") }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const mockOnSave = vi.fn<() => Promise<void>>();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(props?: Partial<React.ComponentProps<typeof DoctorForm>>) {
  return render(
    <DoctorForm
      departmentId="dept-1"
      onSave={mockOnSave}
      onCancel={mockOnCancel}
      {...props}
    />,
  );
}

describe("DoctorForm", () => {
  it("renders form fields and buttons", () => {
    setup();
    expect(screen.getByText("医生姓名")).toBeInTheDocument();
    expect(screen.getByText("职称")).toBeInTheDocument();
    expect(screen.getByText("擅长领域")).toBeInTheDocument();
    expect(screen.getByText("简介")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields on submit", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请输入医生姓名")).toBeInTheDocument();
    expect(screen.getByText("请输入擅长领域")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("calls onSave with form data on valid submit", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce();
    setup();

    await user.type(screen.getByPlaceholderText("请输入姓名"), "李医生");
    await user.type(screen.getByPlaceholderText("如：心血管疾病、高血压"), "心血管");
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "李医生",
          specialty: "心血管",
          departmentId: "dept-1",
        }),
      );
    });
  });

  it("has select with all title options", () => {
    setup();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    // Default should be "主治医师"
    expect((select as HTMLSelectElement).value).toBe("主治医师");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent("主任医师");
    expect(options[1]).toHaveTextContent("副主任医师");
    expect(options[2]).toHaveTextContent("主治医师");
    expect(options[3]).toHaveTextContent("住院医师");
  });

  it("pre-fills initialData and allows editing title", async () => {
    const user = userEvent.setup();
    setup({ initialData: { name: "王医生", title: "主任医师" } });

    const nameInput = screen.getByPlaceholderText("请输入姓名") as HTMLInputElement;
    expect(nameInput.value).toBe("王医生");

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("主任医师");

    // Change title
    await user.selectOptions(select, "副主任医师");
    expect(select.value).toBe("副主任医师");
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

  it("clears error when user types after validation", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请输入医生姓名")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("请输入姓名"), "张医生");
    expect(screen.queryByText("请输入医生姓名")).not.toBeInTheDocument();
  });

  it("contains hidden departmentId input", () => {
    setup();
    const hiddenInput = document.querySelector('input[name="departmentId"]') as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput.value).toBe("dept-1");
  });
});

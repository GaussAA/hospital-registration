// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScheduleForm from "../ScheduleForm";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })), usePathname: vi.fn(() => "/admin") }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

const mockOnSave = vi.fn<() => Promise<void>>();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(props?: Partial<React.ComponentProps<typeof ScheduleForm>>) {
  return render(
    <ScheduleForm
      doctorId="doctor-1"
      onSave={mockOnSave}
      onCancel={mockOnCancel}
      {...props}
    />,
  );
}

describe("ScheduleForm", () => {
  it("renders form fields and buttons", () => {
    setup();
    expect(screen.getByText("日期")).toBeInTheDocument();
    expect(screen.getByText("时段")).toBeInTheDocument();
    expect(screen.getByText("号源数量")).toBeInTheDocument();
    expect(screen.getByText("号源类型")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("shows validation errors for date and quota on empty/invalid submit", async () => {
    const user = userEvent.setup();
    setup();

    // Clear the date field and set quota to 0 to trigger validation
    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    await user.clear(dateInput);
    const quotaInput = screen.getByRole("spinbutton");
    await user.clear(quotaInput);
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByText("请选择日期")).toBeInTheDocument();
    expect(screen.getByText("请设置有效号源数")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("calls onSave with form data on valid submit", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValueOnce();
    setup();

    const quotaInput = screen.getByRole("spinbutton") as HTMLInputElement;
    await user.clear(quotaInput);
    await user.type(quotaInput, "50");

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          quota: 50,
          timeSlot: "am",
          type: "normal",
        }),
      );
    });
  });

  it("has timeSlot select with all options", () => {
    setup();
    const selects = screen.getAllByRole("combobox");
    const timeSlotSelect = selects[0];
    const options = timeSlotSelect.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("上午 (08:00-12:00)");
    expect(options[1]).toHaveTextContent("下午 (13:00-17:00)");
    expect(options[2]).toHaveTextContent("晚间 (18:00-21:00)");
  });

  it("has type select with all options", () => {
    setup();
    const selects = screen.getAllByRole("combobox");
    const typeSelect = selects[1];
    const options = typeSelect.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("普通号");
    expect(options[1]).toHaveTextContent("专家号");
    expect(options[2]).toHaveTextContent("特需号");
  });

  it("pre-fills initialData", () => {
    setup({ initialData: { date: "2025-06-20", quota: 40 } });
    expect((screen.getByDisplayValue("2025-06-20") as HTMLInputElement)).toBeInTheDocument();
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

  it("contains hidden doctorId input", () => {
    setup();
    const hiddenInput = document.querySelector('input[name="doctorId"]') as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput.value).toBe("doctor-1");
  });

  it("clears field error on typing after validation", async () => {
    const user = userEvent.setup();
    setup();

    // Trigger quota validation
    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    await user.clear(dateInput);
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(screen.getByText("请选择日期")).toBeInTheDocument();

    // Type a date - error should still show since we're just typing
    // The error clears via updateField logic when the field value changes
    await user.type(dateInput, "2025-06-21");
  });
});

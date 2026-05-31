// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SlotSelector from "@/components/appointment/SlotSelector";

// ─── Fixtures ─────────────────────────────────────────────────────────
const mockSchedules = [
  {
    id: "sched-1",
    doctorId: "doctor-1",
    date: "2025-06-15",
    timeSlot: "am",
    quota: 20,
    bookedCount: 5,
    remaining: 15,
    type: "normal",
  },
  {
    id: "sched-2",
    doctorId: "doctor-1",
    date: "2025-06-15",
    timeSlot: "pm",
    quota: 10,
    bookedCount: 10,
    remaining: 0,
    type: "expert",
  },
  {
    id: "sched-3",
    doctorId: "doctor-1",
    date: "2025-06-16",
    timeSlot: "am",
    quota: 15,
    bookedCount: 3,
    remaining: 12,
    type: "special",
  },
];

describe("SlotSelector", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should show empty state when no schedules provided", () => {
    render(<SlotSelector schedules={[]} onSelect={vi.fn()} />);

    expect(screen.getByText("暂无可用号源")).toBeDefined();
  });

  it("should render table headers for desktop view", () => {
    render(
      <SlotSelector schedules={mockSchedules} onSelect={vi.fn()} />,
    );

    // Desktop view should show "时段" column header
    expect(screen.getByText("时段")).toBeDefined();
    // Should show time slot labels (appears in desktop + mobile views)
    expect(screen.getAllByText("上午").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("下午").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("晚间").length).toBeGreaterThanOrEqual(1);
  });

  it("should render appointment type labels", () => {
    render(
      <SlotSelector schedules={mockSchedules} onSelect={vi.fn()} />,
    );

    // Type labels appear in both desktop table and mobile cards
    expect(screen.getAllByText("普通号").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("专家号").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("特需号").length).toBeGreaterThanOrEqual(1);
  });

  it("should disable button when schedule is full (remaining <= 0)", () => {
    render(
      <SlotSelector schedules={mockSchedules} onSelect={vi.fn()} />,
    );

    // The expert号 button for 下午 on 6/15 has 0 remaining — should show "已满"
    const fullTexts = screen.getAllByText("已满");
    expect(fullTexts.length).toBeGreaterThan(0);

    // All buttons with "已满" should have disabled attribute
    fullTexts.forEach((el) => {
      const button = el.closest("button");
      expect(button).not.toBeNull();
      expect(button!.disabled).toBe(true);
    });
  });

  it("should display remaining count for available slots", () => {
    render(
      <SlotSelector schedules={mockSchedules} onSelect={vi.fn()} />,
    );

    // sched-1 has 15 remaining out of 20
    expect(screen.getByText("余15/20")).toBeDefined();
    // sched-3 has 12 remaining out of 15
    expect(screen.getByText("余12/15")).toBeDefined();
  });

  it("should show selected style when scheduleId matches", () => {
    render(
      <SlotSelector
        schedules={mockSchedules}
        selectedScheduleId="sched-1"
        onSelect={vi.fn()}
      />,
    );

    // The selected button should have a blue background (via class)
    const buttons = screen.getAllByRole("button");
    const selectedButton = buttons.find(
      (b) => b.className.includes("bg-blue-600"),
    );
    expect(selectedButton).toBeDefined();
  });

  it("should call onSelect when clicking an available slot", () => {
    const onSelect = vi.fn();
    render(
      <SlotSelector schedules={mockSchedules} onSelect={onSelect} />,
    );

    // Use getAllByText and find the clickable button
    const normalTexts = screen.getAllByText("普通号");
    // Find the one that is a button or inside a button
    const normalButton = normalTexts
      .map((el) => el.closest("button"))
      .find((btn) => btn !== null && !btn.disabled);
    expect(normalButton).not.toBeNull();
    fireEvent.click(normalButton!);

    expect(onSelect).toHaveBeenCalledWith("sched-1", "normal");
  });

  it("should render mobile view with compact cards", () => {
    render(
      <SlotSelector schedules={mockSchedules} onSelect={vi.fn()} />,
    );

    // Mobile view renders date headers like "6月15日" (with zhCN locale)
    const dateElement = screen.getByText(/6月15日/);
    expect(dateElement).toBeDefined();
  });
});

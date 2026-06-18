// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ScheduleCalendar from "../ScheduleCalendar";

const mockSchedules = [
  {
    id: "slot-1",
    date: formatDateString(new Date()),
    timeSlot: "am" as const,
    type: "normal",
    quota: 20,
    bookedCount: 5,
    remaining: 15,
  },
  {
    id: "slot-2",
    date: formatDateString(new Date()),
    timeSlot: "pm" as const,
    type: "expert",
    quota: 10,
    bookedCount: 10,
    remaining: 0,
  },
  {
    id: "slot-3",
    date: formatDateString(addDays(new Date(), 1)),
    timeSlot: "am" as const,
    type: "special",
    quota: 15,
    bookedCount: 3,
    remaining: 12,
  },
];

function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

describe("ScheduleCalendar", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("should render title and subtitle", () => {
    render(<ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />);
    expect(screen.getByText("排班日历")).toBeDefined();
    expect(screen.getByText("未来 7 天出诊信息")).toBeDefined();
  });

  it("should render time slot labels", () => {
    render(<ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />);
    expect(screen.getByText("上午")).toBeDefined();
    expect(screen.getByText("下午")).toBeDefined();
    expect(screen.getByText("晚间")).toBeDefined();
  });

  it("should render type labels for available slots", () => {
    render(<ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />);
    // In desktop view, type labels appear inside buttons
    const normalLabels = screen.getAllByText("普通号");
    expect(normalLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("should disable full slots (remaining <= 0)", () => {
    render(<ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />);
    // slot-2 has 0 remaining, buttons with it should be disabled
    const expertButtons = screen.getAllByText("专家号");
    for (const btn of expertButtons) {
      const button = btn.closest("button");
      if (button) {
        expect(button.disabled).toBe(true);
      }
    }
  });

  it("should call onSlotSelect when clicking an available slot", () => {
    const onSlotSelect = vi.fn();
    render(
      <ScheduleCalendar
        schedules={mockSchedules}
        doctorId="doctor-1"
        onSlotSelect={onSlotSelect}
      />,
    );
    // Click the available normal号 button
    const normalButtons = screen.getAllByText("普通号");
    const availableButton = normalButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn !== null && !btn.disabled);
    expect(availableButton).not.toBeNull();
    fireEvent.click(availableButton!);
    expect(onSlotSelect).toHaveBeenCalledTimes(1);
    expect(onSlotSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "slot-1" }),
    );
  });

  it("should render mobile view for small screens", () => {
    const { container } = render(
      <ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />,
    );
    // Mobile view has "暂无排班" for empty slots
    // Also the mobile section has md:hidden class
    const mobileDiv = container.querySelector(".md\\:hidden");
    expect(mobileDiv).not.toBeNull();
  });

  it("should render dash for empty table cells in desktop view", () => {
    render(<ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />);
    // Empty cells render em-dash —
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("should render remaining count for available slots", () => {
    render(<ScheduleCalendar schedules={mockSchedules} doctorId="doctor-1" />);
    // slot-1: 剩余 15/20
    expect(screen.getByText("剩余 15/20")).toBeDefined();
  });

  it("should show selected style for matching selectedSlotId", () => {
    render(
      <ScheduleCalendar
        schedules={mockSchedules}
        doctorId="doctor-1"
        selectedSlotId="slot-1"
      />,
    );
    // The selected button should have bg-blue-600
    const normalButtons = screen.getAllByText("普通号");
    const selectedButton = normalButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn !== null && btn.className.includes("bg-blue-600"));
    expect(selectedButton).not.toBeNull();
  });

  it("should handle empty schedules array", () => {
    const { container } = render(
      <ScheduleCalendar schedules={[]} doctorId="doctor-1" />,
    );
    // Desktop view shows dashes for all cells
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(21); // 7 days * 3 time slots
    // Mobile view shows "暂无排班"
    const noSchedules = screen.getAllByText("暂无排班");
    expect(noSchedules.length).toBe(7); // 7 days
  });
});

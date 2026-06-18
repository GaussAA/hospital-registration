import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup using vi.hoisted ──

const mockGetDoctorById = vi.hoisted(() => vi.fn());
const mockListSchedulesByDoctor = vi.hoisted(() => vi.fn());
const mockGetDoctorSchedulesSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/features/hospital/queries", () => ({
  getDoctorById: mockGetDoctorById,
  listSchedulesByDoctor: mockListSchedulesByDoctor,
}));

const mockFmtDoctor = vi.hoisted(() => vi.fn((d) => `${d.name} ${d.title}`));
const mockFmtSchedule = vi.hoisted(() => {
  const labels: Record<string, string> = { am: "上午", pm: "下午", evening: "晚间" };
  return vi.fn((s) => labels[s.timeSlot] || s.timeSlot);
});

vi.mock("../../formatters", () => ({
  fmtDoctor: mockFmtDoctor,
  fmtSchedule: mockFmtSchedule,
}));

vi.mock("../../validators", () => ({
  getDoctorSchedulesSchema: {
    safeParse: mockGetDoctorSchedulesSchemaSafeParse,
  },
}));

import { handleGetDoctorSchedules } from "../schedule";

describe("handleGetDoctorSchedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return schedules grouped by date", async () => {
    mockGetDoctorSchedulesSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "doc-1" },
    });
    mockGetDoctorById.mockResolvedValue({
      id: "doc-1",
      name: "张三",
      title: "主任医师",
      hospitalName: "北京医院",
      departmentName: "内科",
    });
    mockListSchedulesByDoctor.mockResolvedValue([
      { id: "s-1", date: "2026-06-20", timeSlot: "am", quota: 30, bookedCount: 10, type: "normal" },
      { id: "s-2", date: "2026-06-20", timeSlot: "pm", quota: 20, bookedCount: 5, type: "normal" },
      { id: "s-3", date: "2026-06-21", timeSlot: "am", quota: 30, bookedCount: 15, type: "expert" },
    ]);

    const result = await handleGetDoctorSchedules({ doctorId: "doc-1" });

    expect(result).toContain("北京医院");
    expect(result).toContain("内科");
    expect(result).toContain("张三");
    expect(result).toContain("未来7天排班");
    expect(result).toContain("2026-06-20");
    expect(result).toContain("2026-06-21");
    expect(mockGetDoctorById).toHaveBeenCalledWith("doc-1");
    expect(mockListSchedulesByDoctor).toHaveBeenCalledWith("doc-1");
  });

  it("should return 暂无 message when no schedules found", async () => {
    mockGetDoctorSchedulesSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "doc-1" },
    });
    mockGetDoctorById.mockResolvedValue({
      id: "doc-1",
      name: "张三",
      title: "主任医师",
      hospitalName: "北京医院",
      departmentName: "内科",
    });
    mockListSchedulesByDoctor.mockResolvedValue([]);

    const result = await handleGetDoctorSchedules({ doctorId: "doc-1" });

    expect(result).toBe('医生"张三"未来7天暂无排班。');
  });

  it("should return parameter error on invalid args", async () => {
    mockGetDoctorSchedulesSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "医生ID不能为空" }],
      },
    });

    const result = await handleGetDoctorSchedules({});

    expect(result).toBe("参数错误：医生ID不能为空");
    expect(mockGetDoctorById).not.toHaveBeenCalled();
    expect(mockListSchedulesByDoctor).not.toHaveBeenCalled();
  });

  it("should catch error when doctor not found", async () => {
    mockGetDoctorSchedulesSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "invalid" },
    });
    mockGetDoctorById.mockRejectedValue(new Error("Not found"));

    const result = await handleGetDoctorSchedules({ doctorId: "invalid" });

    expect(result).toBe("未找到该医生。");
    expect(mockListSchedulesByDoctor).not.toHaveBeenCalled();
  });

  it("should handle multiple schedules on same date correctly", async () => {
    mockGetDoctorSchedulesSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "doc-1" },
    });
    mockGetDoctorById.mockResolvedValue({
      id: "doc-1",
      name: "张三",
      title: "主任医师",
      hospitalName: "北京医院",
      departmentName: "内科",
    });
    mockListSchedulesByDoctor.mockResolvedValue([
      { id: "s-1", date: "2026-06-20", timeSlot: "am", quota: 30, bookedCount: 10, type: "normal" },
      { id: "s-2", date: "2026-06-20", timeSlot: "pm", quota: 20, bookedCount: 5, type: "expert" },
    ]);

    const result = await handleGetDoctorSchedules({ doctorId: "doc-1" });

    // Date should appear only once as header
    const dateMatches = result.match(/2026-06-20/g);
    expect(dateMatches).toHaveLength(1);
    expect(result).toContain("上午");
    expect(result).toContain("下午");
  });
});

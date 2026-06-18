import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ToolContext } from "../../types";

// ── Mock setup using vi.hoisted ──

const mockCreateRegistration = vi.hoisted(() => vi.fn());
const mockListRegistrations = vi.hoisted(() => vi.fn());
const mockCancelRegistration = vi.hoisted(() => vi.fn());
const mockCreateRegistrationSchemaSafeParse = vi.hoisted(() => vi.fn());
const mockListRegistrationsSchemaSafeParse = vi.hoisted(() => vi.fn());
const mockCancelRegistrationSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/features/registration/queries", () => ({
  createRegistration: mockCreateRegistration,
  listRegistrations: mockListRegistrations,
  cancelRegistration: mockCancelRegistration,
}));

vi.mock("../../validators", () => ({
  createRegistrationSchema: {
    safeParse: mockCreateRegistrationSchemaSafeParse,
  },
  listRegistrationsSchema: {
    safeParse: mockListRegistrationsSchemaSafeParse,
  },
  cancelRegistrationSchema: {
    safeParse: mockCancelRegistrationSchemaSafeParse,
  },
}));

vi.mock("../../formatters", () => ({
  statusLabels: { pending: "待就诊", done: "已完成", cancelled: "已取消" },
  timeSlotLabels: { am: "上午", pm: "下午", evening: "晚间" },
  typeLabels: { normal: "普通号", expert: "专家号", special: "特需号" },
}));

import {
  handleCreateRegistration,
  handleListRegistrations,
  handleCancelRegistration,
} from "../registration";

const loggedInCtx: ToolContext = { userId: "user-123" };
const guestCtx: ToolContext = {};

// Helper: create a registration-like object for mocking
function makeRegistration(overrides: Record<string, unknown> = {}) {
  return {
    id: "reg-1",
    date: "2026-06-20",
    timeSlot: "am",
    type: "normal",
    status: "pending",
    doctor: {
      name: "张三",
      title: "主任医师",
      department: { name: "内科" },
      hospital: { name: "北京医院", id: "h-1" },
    },
    profile: { name: "李四" },
    ...overrides,
  };
}

describe("handleCreateRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create registration successfully", async () => {
    mockCreateRegistrationSchemaSafeParse.mockReturnValue({
      success: true,
      data: { scheduleId: "sched-1", profileId: "p-1", type: "normal" },
    });
    mockCreateRegistration.mockResolvedValue(makeRegistration());

    const result = await handleCreateRegistration(
      { scheduleId: "sched-1", profileId: "p-1", type: "normal" },
      loggedInCtx,
    );

    expect(result).toContain("挂号成功");
    expect(result).toContain("北京医院");
    expect(result).toContain("内科");
    expect(result).toContain("张三");
    expect(result).toContain("李四");
    expect(result).toContain("上午");
    expect(result).toContain("普通号");
    expect(result).toContain("reg-1");
    expect(mockCreateRegistration).toHaveBeenCalledWith("user-123", "sched-1", "p-1", "normal");
  });

  it("should return login prompt when user is not logged in", async () => {
    const result = await handleCreateRegistration({}, guestCtx);

    expect(result).toBe("您还未登录，请先登录后再进行挂号。");
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should return parameter error on invalid args", async () => {
    mockCreateRegistrationSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          { message: "排班ID不能为空" },
          { message: "就诊人ID不能为空" },
        ],
      },
    });

    const result = await handleCreateRegistration({}, loggedInCtx);

    expect(result).toBe("参数错误：排班ID不能为空；就诊人ID不能为空");
    expect(mockCreateRegistration).not.toHaveBeenCalled();
  });

  it("should return failure message on error", async () => {
    mockCreateRegistrationSchemaSafeParse.mockReturnValue({
      success: true,
      data: { scheduleId: "sched-1", profileId: "p-1", type: "normal" },
    });
    mockCreateRegistration.mockRejectedValue(new Error("该时段已约满"));

    const result = await handleCreateRegistration(
      { scheduleId: "sched-1", profileId: "p-1", type: "normal" },
      loggedInCtx,
    );

    expect(result).toContain("挂号失败");
    expect(result).toContain("该时段已约满");
  });

  it("should handle missing doctor/property with fallback", async () => {
    mockCreateRegistrationSchemaSafeParse.mockReturnValue({
      success: true,
      data: { scheduleId: "sched-1", profileId: "p-1", type: "normal" },
    });
    mockCreateRegistration.mockResolvedValue(makeRegistration({ doctor: null, profile: null }));

    const result = await handleCreateRegistration({ scheduleId: "sched-1", profileId: "p-1", type: "normal" }, loggedInCtx);

    expect(result).toContain("未知");
    expect(result).toContain("挂号成功");
  });
});

describe("handleListRegistrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list registrations successfully", async () => {
    mockListRegistrationsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { status: undefined },
    });
    mockListRegistrations.mockResolvedValue({
      list: [
        makeRegistration({ id: "reg-1" }),
        makeRegistration({ id: "reg-2", date: "2026-06-21" }),
      ],
      total: 2,
    });

    const result = await handleListRegistrations({}, loggedInCtx);

    expect(result).toContain("挂号记录");
    expect(result).toContain("共2条");
    expect(result).toContain("reg-1");
    expect(result).toContain("reg-2");
    expect(mockListRegistrations).toHaveBeenCalledWith("user-123", undefined, 1, 20);
  });

  it("should filter by status", async () => {
    mockListRegistrationsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { status: "pending" },
    });
    mockListRegistrations.mockResolvedValue({ list: [], total: 0 });

    await handleListRegistrations({ status: "pending" }, loggedInCtx);

    expect(mockListRegistrations).toHaveBeenCalledWith("user-123", "pending", 1, 20);
  });

  it("should return 暂无 message when no records", async () => {
    mockListRegistrationsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { status: undefined },
    });
    mockListRegistrations.mockResolvedValue({ list: [], total: 0 });

    const result = await handleListRegistrations({}, loggedInCtx);

    expect(result).toBe("暂未找到挂号记录。");
  });

  it("should return login prompt when user is not logged in", async () => {
    const result = await handleListRegistrations({}, guestCtx);

    expect(result).toBe("您还未登录，请先登录后再查看挂号记录。");
    expect(mockListRegistrations).not.toHaveBeenCalled();
  });

  it("should return parameter error on invalid status", async () => {
    mockListRegistrationsSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "无效的状态值" }],
      },
    });

    const result = await handleListRegistrations({ status: "invalid" }, loggedInCtx);

    expect(result).toBe("参数错误：无效的状态值");
    expect(mockListRegistrations).not.toHaveBeenCalled();
  });

  it("should handle query error gracefully", async () => {
    mockListRegistrationsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { status: undefined },
    });
    mockListRegistrations.mockRejectedValue(new Error("数据库连接失败"));

    const result = await handleListRegistrations({}, loggedInCtx);

    expect(result).toContain("查询挂号记录时出错");
    expect(result).toContain("数据库连接失败");
  });
});

describe("handleCancelRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cancel registration successfully", async () => {
    mockCancelRegistrationSchemaSafeParse.mockReturnValue({
      success: true,
      data: { registrationId: "reg-1" },
    });
    mockCancelRegistration.mockResolvedValue(undefined);

    const result = await handleCancelRegistration({ registrationId: "reg-1" }, loggedInCtx);

    expect(result).toBe("✅ 挂号已取消成功（编号：reg-1）");
    expect(mockCancelRegistration).toHaveBeenCalledWith("reg-1", "user-123");
  });

  it("should return login prompt when user is not logged in", async () => {
    const result = await handleCancelRegistration({}, guestCtx);

    expect(result).toBe("您还未登录，请先登录后再操作。");
    expect(mockCancelRegistration).not.toHaveBeenCalled();
  });

  it("should return parameter error on invalid args", async () => {
    mockCancelRegistrationSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "挂号记录ID不能为空" }],
      },
    });

    const result = await handleCancelRegistration({}, loggedInCtx);

    expect(result).toBe("参数错误：挂号记录ID不能为空");
    expect(mockCancelRegistration).not.toHaveBeenCalled();
  });

  it("should return failure message on error", async () => {
    mockCancelRegistrationSchemaSafeParse.mockReturnValue({
      success: true,
      data: { registrationId: "reg-1" },
    });
    mockCancelRegistration.mockRejectedValue(new Error("已过取消时限"));

    const result = await handleCancelRegistration({ registrationId: "reg-1" }, loggedInCtx);

    expect(result).toBe("❌ 取消失败：已过取消时限");
  });
});

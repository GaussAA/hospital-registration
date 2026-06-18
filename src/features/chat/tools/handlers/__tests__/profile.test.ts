import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ToolContext } from "../../types";

// ── Mock setup using vi.hoisted ──

const mockGetPatientProfilesByUser = vi.hoisted(() => vi.fn());
const mockCreatePatientProfile = vi.hoisted(() => vi.fn());
const mockCreatePatientProfileSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/queries", () => ({
  getPatientProfilesByUser: mockGetPatientProfilesByUser,
  createPatientProfile: mockCreatePatientProfile,
}));

const mockFmtProfile = vi.hoisted(() => vi.fn((p) => p.name));

vi.mock("../../formatters", () => ({
  fmtProfile: mockFmtProfile,
}));

vi.mock("../../validators", () => ({
  createPatientProfileSchema: {
    safeParse: mockCreatePatientProfileSchemaSafeParse,
  },
}));

import { handleGetPatientProfiles, handleCreatePatientProfile } from "../profile";

const loggedInCtx: ToolContext = { userId: "user-123" };
const guestCtx: ToolContext = {};

describe("handleGetPatientProfiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return profile list when profiles exist", async () => {
    mockGetPatientProfilesByUser.mockResolvedValue([
      { id: "p-1", name: "张三" },
      { id: "p-2", name: "李四" },
    ]);

    const result = await handleGetPatientProfiles({}, loggedInCtx);

    expect(result).toContain("就诊人列表");
    expect(result).toContain("张三");
    expect(result).toContain("李四");
    expect(mockGetPatientProfilesByUser).toHaveBeenCalledWith("user-123");
  });

  it("should return 暂无 message when no profiles exist", async () => {
    mockGetPatientProfilesByUser.mockResolvedValue([]);

    const result = await handleGetPatientProfiles({}, loggedInCtx);

    expect(result).toBe("您还没有添加就诊人，请输入就诊人信息进行添加（姓名、身份证号、手机号、性别）。");
  });

  it("should return login prompt when user is not logged in", async () => {
    const result = await handleGetPatientProfiles({}, guestCtx);

    expect(result).toBe("您还未登录，请先登录后再查看就诊人信息。");
    expect(mockGetPatientProfilesByUser).not.toHaveBeenCalled();
  });
});

describe("handleCreatePatientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create profile successfully", async () => {
    mockCreatePatientProfileSchemaSafeParse.mockReturnValue({
      success: true,
      data: { name: "张三", idCard: "110101199001011234", phone: "13800138000", gender: "male" },
    });
    mockCreatePatientProfile.mockResolvedValue({
      id: "p-1",
      name: "张三",
      gender: "male",
      idCard: "110101199001011234",
      phone: "13800138000",
    });

    const result = await handleCreatePatientProfile(
      { name: "张三", idCard: "110101199001011234", phone: "13800138000", gender: "male" },
      loggedInCtx,
    );

    expect(result).toBe("✅ 就诊人添加成功：张三");
    expect(mockCreatePatientProfile).toHaveBeenCalledWith("user-123", {
      name: "张三",
      idCard: "110101199001011234",
      phone: "13800138000",
      gender: "male",
    });
  });

  it("should return login prompt when user is not logged in", async () => {
    const result = await handleCreatePatientProfile({}, guestCtx);

    expect(result).toBe("您还未登录，请先登录后再添加就诊人。");
    expect(mockCreatePatientProfile).not.toHaveBeenCalled();
  });

  it("should return parameter error on invalid args", async () => {
    mockCreatePatientProfileSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          { message: "就诊人姓名不能为空" },
          { message: "身份证号不能为空" },
        ],
      },
    });

    const result = await handleCreatePatientProfile({}, loggedInCtx);

    expect(result).toBe("参数错误：就诊人姓名不能为空；身份证号不能为空");
    expect(mockCreatePatientProfile).not.toHaveBeenCalled();
  });
});

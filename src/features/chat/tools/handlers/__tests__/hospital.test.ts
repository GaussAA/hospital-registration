import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup using vi.hoisted ──

const mockListHospitals = vi.hoisted(() => vi.fn());
const mockGetHospitalById = vi.hoisted(() => vi.fn());
const mockListDepartmentsByHospital = vi.hoisted(() => vi.fn());
const mockSearchHospitalsSchemaSafeParse = vi.hoisted(() => vi.fn());
const mockGetHospitalDetailSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/features/hospital/queries", () => ({
  listHospitals: mockListHospitals,
  getHospitalById: mockGetHospitalById,
  listDepartmentsByHospital: mockListDepartmentsByHospital,
}));

const mockFmtHospital = vi.hoisted(() => vi.fn((h) => `${h.name}[ID:${h.id}]`));
const mockFmtDepartment = vi.hoisted(() => vi.fn((d) => d.name));

vi.mock("../../formatters", () => ({
  fmtHospital: mockFmtHospital,
  fmtDepartment: mockFmtDepartment,
}));

vi.mock("../../validators", () => ({
  searchHospitalsSchema: {
    safeParse: mockSearchHospitalsSchemaSafeParse,
  },
  getHospitalDetailSchema: {
    safeParse: mockGetHospitalDetailSchemaSafeParse,
  },
}));

import { handleSearchHospitals, handleGetHospitalDetail } from "../hospital";

describe("handleSearchHospitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return hospital list when hospitals exist", async () => {
    mockSearchHospitalsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { keyword: "北京", city: undefined, level: undefined },
    });
    mockListHospitals.mockResolvedValue({
      list: [
        { id: "h-1", name: "北京医院", level: "三甲", city: "北京", address: "东城区" },
        { id: "h-2", name: "协和医院", level: "三甲", city: "北京", address: "东城区" },
      ],
      total: 2,
    });

    const result = await handleSearchHospitals({ keyword: "北京" });

    expect(result).toContain("找到了 2 家医院");
    expect(result).toContain("北京医院");
    expect(result).toContain("协和医院");
    expect(mockListHospitals).toHaveBeenCalledWith({
      keyword: "北京",
      city: undefined,
      level: undefined,
      page: 1,
      pageSize: 10,
    });
  });

  it("should return 暂无 message when no hospitals found", async () => {
    mockSearchHospitalsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { keyword: "未知医院", city: undefined, level: undefined },
    });
    mockListHospitals.mockResolvedValue({ list: [], total: 0 });

    const result = await handleSearchHospitals({ keyword: "未知医院" });

    expect(result).toBe("抱歉，没有找到符合条件的医院。");
  });

  it("should pass city and level filters", async () => {
    mockSearchHospitalsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { keyword: undefined, city: "上海", level: "三甲" },
    });
    mockListHospitals.mockResolvedValue({ list: [], total: 0 });

    await handleSearchHospitals({ city: "上海", level: "三甲" });

    expect(mockListHospitals).toHaveBeenCalledWith({
      keyword: undefined,
      city: "上海",
      level: "三甲",
      page: 1,
      pageSize: 10,
    });
  });

  it("should return parameter error on invalid args", async () => {
    mockSearchHospitalsSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "参数格式错误" }],
      },
    });

    const result = await handleSearchHospitals({ invalid: true });

    expect(result).toBe("参数错误：参数格式错误");
    expect(mockListHospitals).not.toHaveBeenCalled();
  });
});

describe("handleGetHospitalDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return hospital detail with departments", async () => {
    mockGetHospitalDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "h-1" },
    });
    mockGetHospitalById.mockResolvedValue({
      id: "h-1",
      name: "北京医院",
      level: "三甲",
      city: "北京",
      address: "东城区",
      description: "知名综合医院",
      phone: "010-1234",
    });
    mockListDepartmentsByHospital.mockResolvedValue([
      { id: "d-1", name: "内科" },
      { id: "d-2", name: "外科" },
    ]);

    const result = await handleGetHospitalDetail({ hospitalId: "h-1" });

    expect(result).toContain("北京医院");
    expect(result).toContain("知名综合医院");
    expect(result).toContain("内科");
    expect(result).toContain("外科");
    expect(result).toContain("共2个");
  });

  it("should return hospital detail without departments when none exist", async () => {
    mockGetHospitalDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "h-1" },
    });
    mockGetHospitalById.mockResolvedValue({
      id: "h-1",
      name: "北京医院",
      level: "三甲",
      city: "北京",
      address: "东城区",
      description: "知名综合医院",
    });
    mockListDepartmentsByHospital.mockResolvedValue([]);

    const result = await handleGetHospitalDetail({ hospitalId: "h-1" });

    expect(result).toContain("北京医院");
    expect(result).not.toContain("共");
  });

  it("should show 暂无简介 when description is missing", async () => {
    mockGetHospitalDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "h-1" },
    });
    mockGetHospitalById.mockResolvedValue({
      id: "h-1",
      name: "北京医院",
      level: "三甲",
      city: "北京",
      address: "东城区",
    });
    mockListDepartmentsByHospital.mockResolvedValue([]);

    const result = await handleGetHospitalDetail({ hospitalId: "h-1" });

    expect(result).toContain("暂无简介");
  });

  it("should tolerate departments fetch failure", async () => {
    mockGetHospitalDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "h-1" },
    });
    mockGetHospitalById.mockResolvedValue({
      id: "h-1",
      name: "北京医院",
      level: "三甲",
      city: "北京",
      address: "东城区",
      description: "知名综合医院",
    });
    mockListDepartmentsByHospital.mockRejectedValue(new Error("DB error"));

    const result = await handleGetHospitalDetail({ hospitalId: "h-1" });

    expect(result).toContain("北京医院");
    expect(result).toContain("知名综合医院");
  });

  it("should return parameter error on invalid args", async () => {
    mockGetHospitalDetailSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "医院ID不能为空" }],
      },
    });

    const result = await handleGetHospitalDetail({});

    expect(result).toBe("参数错误：医院ID不能为空");
    expect(mockGetHospitalById).not.toHaveBeenCalled();
  });

  it("should catch error when hospital not found", async () => {
    mockGetHospitalDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "invalid" },
    });
    mockGetHospitalById.mockRejectedValue(new Error("Not found"));

    const result = await handleGetHospitalDetail({ hospitalId: "invalid" });

    expect(result).toBe("未找到该医院。");
  });
});

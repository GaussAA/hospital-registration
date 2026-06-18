import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup using vi.hoisted ──

const mockListDepartmentsByHospital = vi.hoisted(() => vi.fn());
const mockSearchDepartmentsSchemaSafeParse = vi.hoisted(() => vi.fn());
const mockRecommendDepartmentSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/features/hospital/queries", () => ({
  listDepartmentsByHospital: mockListDepartmentsByHospital,
}));

vi.mock("../formatters", () => ({
  fmtDepartment: vi.fn((d) => d.name),
}));

vi.mock("../../validators", () => ({
  searchDepartmentsSchema: {
    safeParse: mockSearchDepartmentsSchemaSafeParse,
  },
  recommendDepartmentSchema: {
    safeParse: mockRecommendDepartmentSchemaSafeParse,
  },
}));

import { handleSearchDepartments, handleRecommendDepartment } from "../department";

describe("handleSearchDepartments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return department list when departments exist", async () => {
    mockSearchDepartmentsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "hosp-1" },
    });
    mockListDepartmentsByHospital.mockResolvedValue([
      { id: "dept-1", name: "内科" },
      { id: "dept-2", name: "外科" },
    ]);

    const result = await handleSearchDepartments({ hospitalId: "hosp-1" });

    expect(result).toContain("科室列表");
    expect(result).toContain("内科");
    expect(result).toContain("外科");
    expect(mockListDepartmentsByHospital).toHaveBeenCalledWith("hosp-1");
  });

  it("should return 暂无 message when no departments found", async () => {
    mockSearchDepartmentsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "hosp-1" },
    });
    mockListDepartmentsByHospital.mockResolvedValue([]);

    const result = await handleSearchDepartments({ hospitalId: "hosp-1" });

    expect(result).toBe("该医院暂无可选科室。");
  });

  it("should return parameter error on invalid args", async () => {
    mockSearchDepartmentsSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "医院ID不能为空" }],
      },
    });

    const result = await handleSearchDepartments({});

    expect(result).toBe("参数错误：医院ID不能为空");
    expect(mockListDepartmentsByHospital).not.toHaveBeenCalled();
  });

  it("should catch error when hospital not found", async () => {
    mockSearchDepartmentsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "invalid" },
    });
    mockListDepartmentsByHospital.mockRejectedValue(new Error("Not found"));

    const result = await handleSearchDepartments({ hospitalId: "invalid" });

    expect(result).toBe("未找到该医院。");
  });
});

describe("handleRecommendDepartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should recommend matching departments for known symptoms", async () => {
    mockRecommendDepartmentSchemaSafeParse.mockReturnValue({
      success: true,
      data: { symptoms: "发烧头痛" },
    });

    const result = await handleRecommendDepartment({ symptoms: "发烧头痛" });

    expect(result).toContain("建议您考虑挂以下科室");
    expect(result).toContain("发热门诊");
    expect(result).toContain("呼吸内科");
    expect(result).toContain("神经内科");
    expect(result).toContain("神经外科");
  });

  it("should recommend unique departments (no duplicates)", async () => {
    mockRecommendDepartmentSchemaSafeParse.mockReturnValue({
      success: true,
      data: { symptoms: "发烧" },
    });

    const result = await handleRecommendDepartment({ symptoms: "发烧" });

    const matches = result.match(/\*\*(\S+)\*\*/g);
    const uniqueCount = matches ? new Set(matches).size : 0;
    expect(uniqueCount).toBe(3); // 发热门诊、呼吸内科、感染科
  });

  it("should return fallback suggestion when no symptoms matched", async () => {
    mockRecommendDepartmentSchemaSafeParse.mockReturnValue({
      success: true,
      data: { symptoms: "飞蚊症" },
    });

    const result = await handleRecommendDepartment({ symptoms: "飞蚊症" });

    expect(result).toContain("我没有找到特别匹配的科室");
    expect(result).toContain("急诊科");
  });

  it("should return parameter error on empty symptoms", async () => {
    mockRecommendDepartmentSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "症状描述不能为空" }],
      },
    });

    const result = await handleRecommendDepartment({ symptoms: "" });

    expect(result).toBe("参数错误：症状描述不能为空");
  });

  it("should perform case-insensitive matching", async () => {
    mockRecommendDepartmentSchemaSafeParse.mockReturnValue({
      success: true,
      data: { symptoms: "发烧" },
    });

    const result = await handleRecommendDepartment({ symptoms: "发烧" });

    expect(result).toContain("建议您考虑挂以下科室");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup using vi.hoisted ──

const mockListDoctorsByDepartment = vi.hoisted(() => vi.fn());
const mockGetDoctorById = vi.hoisted(() => vi.fn());
const mockSearchDoctorsSchemaSafeParse = vi.hoisted(() => vi.fn());
const mockGetDoctorDetailSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/features/hospital/queries", () => ({
  listDoctorsByDepartment: mockListDoctorsByDepartment,
  getDoctorById: mockGetDoctorById,
}));

vi.mock("../../formatters", () => ({
  fmtDoctor: vi.fn((d) => `${d.name} ${d.title}`),
}));

vi.mock("../../validators", () => ({
  searchDoctorsSchema: {
    safeParse: mockSearchDoctorsSchemaSafeParse,
  },
  getDoctorDetailSchema: {
    safeParse: mockGetDoctorDetailSchemaSafeParse,
  },
}));

import { handleSearchDoctors, handleGetDoctorDetail } from "../doctor";

describe("handleSearchDoctors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return doctor list when doctors exist", async () => {
    mockSearchDoctorsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { departmentId: "dept-1" },
    });
    mockListDoctorsByDepartment.mockResolvedValue([
      { id: "doc-1", name: "张三", title: "主任医师" },
      { id: "doc-2", name: "李四", title: "副主任医师" },
    ]);

    const result = await handleSearchDoctors({ departmentId: "dept-1" });

    expect(result).toContain("医生列表");
    expect(result).toContain("张三");
    expect(result).toContain("李四");
    expect(mockListDoctorsByDepartment).toHaveBeenCalledWith("dept-1");
  });

  it("should return 暂无 message when no doctors found", async () => {
    mockSearchDoctorsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { departmentId: "dept-1" },
    });
    mockListDoctorsByDepartment.mockResolvedValue([]);

    const result = await handleSearchDoctors({ departmentId: "dept-1" });

    expect(result).toBe("该科室暂无医生。");
  });

  it("should return parameter error on invalid args", async () => {
    mockSearchDoctorsSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "科室ID不能为空" }],
      },
    });

    const result = await handleSearchDoctors({});

    expect(result).toBe("参数错误：科室ID不能为空");
    expect(mockListDoctorsByDepartment).not.toHaveBeenCalled();
  });

  it("should catch error when department not found", async () => {
    mockSearchDoctorsSchemaSafeParse.mockReturnValue({
      success: true,
      data: { departmentId: "invalid" },
    });
    mockListDoctorsByDepartment.mockRejectedValue(new Error("Not found"));

    const result = await handleSearchDoctors({ departmentId: "invalid" });

    expect(result).toBe("未找到该科室。");
  });
});

describe("handleGetDoctorDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return doctor detail with introduction", async () => {
    mockGetDoctorDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "doc-1" },
    });
    mockGetDoctorById.mockResolvedValue({
      id: "doc-1",
      name: "张三",
      title: "主任医师",
      hospitalName: "北京医院",
      departmentName: "内科",
      introduction: "擅长心血管疾病",
    });

    const result = await handleGetDoctorDetail({ doctorId: "doc-1" });

    expect(result).toContain("张三");
    expect(result).toContain("北京医院");
    expect(result).toContain("内科");
    expect(result).toContain("擅长心血管疾病");
    expect(mockGetDoctorById).toHaveBeenCalledWith("doc-1");
  });

  it("should show 暂无简介 when introduction is missing", async () => {
    mockGetDoctorDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "doc-1" },
    });
    mockGetDoctorById.mockResolvedValue({
      id: "doc-1",
      name: "张三",
      title: "主任医师",
      hospitalName: "北京医院",
      departmentName: "内科",
      introduction: null,
    });

    const result = await handleGetDoctorDetail({ doctorId: "doc-1" });

    expect(result).toContain("暂无简介");
  });

  it("should return parameter error on invalid args", async () => {
    mockGetDoctorDetailSchemaSafeParse.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "医生ID不能为空" }],
      },
    });

    const result = await handleGetDoctorDetail({});

    expect(result).toBe("参数错误：医生ID不能为空");
    expect(mockGetDoctorById).not.toHaveBeenCalled();
  });

  it("should catch error when doctor not found", async () => {
    mockGetDoctorDetailSchemaSafeParse.mockReturnValue({
      success: true,
      data: { doctorId: "invalid" },
    });
    mockGetDoctorById.mockRejectedValue(new Error("Not found"));

    const result = await handleGetDoctorDetail({ doctorId: "invalid" });

    expect(result).toBe("未找到该医生。");
  });
});

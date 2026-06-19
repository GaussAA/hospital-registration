import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock setup using vi.hoisted ──

const mockGetPrisma = vi.hoisted(() => vi.fn());
const mockVisionCompletion = vi.hoisted(() => vi.fn());
const mockIsProviderConfigured = vi.hoisted(() => vi.fn(() => true));
const mockReadFile = vi.hoisted(() => vi.fn());
const mockGetRegistrationGuideSchemaSafeParse = vi.hoisted(() => vi.fn());
const mockAnalyzeImageSchemaSafeParse = vi.hoisted(() => vi.fn());

vi.mock("@/shared/db", () => ({
  getPrisma: mockGetPrisma,
}));

vi.mock("../../../agent/provider", () => ({
  visionCompletion: mockVisionCompletion,
  isProviderConfigured: mockIsProviderConfigured,
}));

vi.mock("../../formatters", () => ({
  imageTypeLabels: { lab_report: "化验单", exam_report: "检查报告", ct_scan: "CT影像", prescription: "处方", other: "图片" },
}));

vi.mock("../../validators", () => ({
  getRegistrationGuideSchema: {
    safeParse: mockGetRegistrationGuideSchemaSafeParse,
  },
  analyzeImageSchema: {
    safeParse: mockAnalyzeImageSchemaSafeParse,
  },
}));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
}));

import path from "path";
import { handleGetRegistrationGuide, handleAnalyzeImage } from "../guide";

describe("handleGetRegistrationGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return general guide without hospital info", async () => {
    mockGetRegistrationGuideSchemaSafeParse.mockReturnValue({
      success: true,
      data: {},
    });
    const result = await handleGetRegistrationGuide({});

    expect(result).toContain("就诊指南");
    expect(result).toContain("就诊前准备");
    expect(result).toContain("就诊流程");
    expect(result).toContain("注意事项");
    expect(result).not.toContain("🏥 医院：");
    expect(mockGetPrisma).not.toHaveBeenCalled();
  });

  it("should include hospital info when hospitalId is provided and hospital exists", async () => {
    mockGetRegistrationGuideSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "h-1" },
    });
    mockGetPrisma.mockResolvedValue({
      hospital: {
        findUnique: vi.fn().mockResolvedValue({
          id: "h-1",
          name: "北京医院",
          address: "东城区",
          phone: "010-1234",
        }),
      },
    });

    const result = await handleGetRegistrationGuide({ hospitalId: "h-1" });

    expect(result).toContain("北京医院");
    expect(result).toContain("东城区");
    expect(result).toContain("010-1234");
  });

  it("should return general guide when hospital is not found", async () => {
    mockGetRegistrationGuideSchemaSafeParse.mockReturnValue({
      success: true,
      data: { hospitalId: "invalid" },
    });
    mockGetPrisma.mockResolvedValue({
      hospital: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    });

    const result = await handleGetRegistrationGuide({ hospitalId: "invalid" });

    expect(result).toContain("就诊指南");
    expect(result).not.toContain("🏥 医院：");
  });
});

describe("handleAnalyzeImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsProviderConfigured.mockReturnValue(true);
  });

  it("should analyze remote image successfully", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "https://example.com/report.jpg", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockVisionCompletion.mockResolvedValue("各项指标正常");

    const result = await handleAnalyzeImage({
      imageUrl: "https://example.com/report.jpg",
      imageType: "lab_report",
    });

    expect(result).toContain("化验单分析结果");
    expect(result).toContain("各项指标正常");
    expect(mockVisionCompletion).toHaveBeenCalled();
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it("should convert local image to base64", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "/uploads/report.png", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockReadFile.mockResolvedValue(Buffer.from("fake-image-data"));
    mockVisionCompletion.mockResolvedValue("分析完成");

    const result = await handleAnalyzeImage({
      imageUrl: "/uploads/report.png",
      imageType: "lab_report",
    });

    expect(result).toContain("分析完成");
    expect(mockReadFile).toHaveBeenCalledWith(
      path.join(process.cwd(), "public", "/uploads/report.png"),
    );
    expect(mockVisionCompletion).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/png;base64,/),
      expect.any(String),
    );
  });

  it("should fallback to original URL when local file read fails", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "/uploads/report.jpg", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockReadFile.mockRejectedValue(new Error("File not found"));
    mockVisionCompletion.mockResolvedValue("分析完成");

    const result = await handleAnalyzeImage({
      imageUrl: "/uploads/report.jpg",
      imageType: "lab_report",
    });

    expect(result).toContain("分析完成");
    expect(mockVisionCompletion).toHaveBeenCalledWith(
      "/uploads/report.jpg",
      expect.any(String),
    );
  });

  it("should return message when AI provider is not configured", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "https://example.com/report.jpg", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(false);

    const result = await handleAnalyzeImage({
      imageUrl: "https://example.com/report.jpg",
      imageType: "lab_report",
    });

    expect(result).toContain("已收到您上传的化验单");
    expect(result).toContain("AI 视觉服务尚未配置");
    expect(mockVisionCompletion).not.toHaveBeenCalled();
  });

  it("should handle generic image type (no label)", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "https://example.com/photo.jpg" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockVisionCompletion.mockResolvedValue("这是一张医疗图片");

    const result = await handleAnalyzeImage({
      imageUrl: "https://example.com/photo.jpg",
    });

    expect(result).toContain("图片分析结果");
    expect(result).toContain("这是一张医疗图片");
  });

  it("should return parameter error on invalid args", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: false,
      error: { issues: [{ message: "图片URL不能为空" }] },
    });

    const result = await handleAnalyzeImage({});

    expect(result).toBe("参数错误：图片URL不能为空");
    expect(mockVisionCompletion).not.toHaveBeenCalled();
  });

  it("should handle vision completion error gracefully", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "https://example.com/report.jpg", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockVisionCompletion.mockRejectedValue(new Error("API rate limit exceeded"));

    const result = await handleAnalyzeImage({
      imageUrl: "https://example.com/report.jpg",
      imageType: "lab_report",
    });

    expect(result).toContain("图片分析请求失败");
    expect(result).toContain("API rate limit exceeded");
  });

  it("should handle non-Error thrown by visionCompletion", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "https://example.com/report.jpg", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockVisionCompletion.mockRejectedValue("string error");

    const result = await handleAnalyzeImage({
      imageUrl: "https://example.com/report.jpg",
      imageType: "lab_report",
    });

    expect(result).toContain("图片分析请求失败");
    expect(result).toContain("未知错误");
  });

  it("should determine correct MIME type for various image extensions", async () => {
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "/uploads/report.webp", imageType: "lab_report" },
    });
    mockIsProviderConfigured.mockReturnValue(true);
    mockReadFile.mockResolvedValue(Buffer.from("data"));
    mockVisionCompletion.mockResolvedValue("ok");

    await handleAnalyzeImage({
      imageUrl: "/uploads/report.webp",
      imageType: "lab_report",
    });
    expect(mockVisionCompletion).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/webp;base64,/),
      expect.any(String),
    );

    mockAnalyzeImageSchemaSafeParse.mockReset();
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "/uploads/report.gif", imageType: "lab_report" },
    });
    mockReadFile.mockResolvedValue(Buffer.from("data"));
    mockVisionCompletion.mockResolvedValue("ok");

    await handleAnalyzeImage({
      imageUrl: "/uploads/report.gif",
      imageType: "lab_report",
    });
    expect(mockVisionCompletion).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/gif;base64,/),
      expect.any(String),
    );

    mockAnalyzeImageSchemaSafeParse.mockReset();
    mockAnalyzeImageSchemaSafeParse.mockReturnValue({
      success: true,
      data: { imageUrl: "/uploads/report.jpeg", imageType: "lab_report" },
    });
    mockReadFile.mockResolvedValue(Buffer.from("data"));
    mockVisionCompletion.mockResolvedValue("ok");

    await handleAnalyzeImage({
      imageUrl: "/uploads/report.jpeg",
      imageType: "lab_report",
    });
    expect(mockVisionCompletion).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/jpeg;base64,/),
      expect.any(String),
    );
  });
});

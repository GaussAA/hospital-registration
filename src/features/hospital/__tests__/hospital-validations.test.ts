import { describe, it, expect } from "vitest";
import {
  listHospitalsSchema,
  departmentIdSchema,
  doctorIdSchema,
} from "@/features/hospital/validations";

describe("listHospitalsSchema", () => {
  it("should apply defaults for empty params", () => {
    const result = listHospitalsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(12);
    expect(result.city).toBeUndefined();
    expect(result.level).toBeUndefined();
    expect(result.keyword).toBeUndefined();
  });

  it("should coerce string numbers for page and pageSize", () => {
    const result = listHospitalsSchema.parse({ page: "2", pageSize: "20" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
  });

  it("should reject negative page numbers", () => {
    expect(() => listHospitalsSchema.parse({ page: "-1" })).toThrow();
  });

  it("should reject zero page numbers", () => {
    expect(() => listHospitalsSchema.parse({ page: "0" })).toThrow();
  });

  it("should reject pageSize larger than 100", () => {
    expect(() => listHospitalsSchema.parse({ pageSize: "200" })).toThrow();
  });

  it("should accept max boundary values for pageSize", () => {
    const result = listHospitalsSchema.parse({ pageSize: "100" });
    expect(result.pageSize).toBe(100);
  });

  it("should parse optional string fields: city, level, keyword", () => {
    const result = listHospitalsSchema.parse({
      city: "北京",
      level: "三级甲等",
      keyword: "人民",
    });
    expect(result.city).toBe("北京");
    expect(result.level).toBe("三级甲等");
    expect(result.keyword).toBe("人民");
  });

  it("should pass full valid input", () => {
    const result = listHospitalsSchema.parse({
      city: "上海",
      level: "二级",
      keyword: "医院",
      page: "3",
      pageSize: "24",
    });
    expect(result.city).toBe("上海");
    expect(result.level).toBe("二级");
    expect(result.keyword).toBe("医院");
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(24);
  });
});

describe("departmentIdSchema", () => {
  it("should accept a valid departmentId", () => {
    const result = departmentIdSchema.parse({ departmentId: "dept-123" });
    expect(result.departmentId).toBe("dept-123");
  });

  it("should reject empty departmentId", () => {
    expect(() => departmentIdSchema.parse({ departmentId: "" })).toThrow(
      "科室ID不能为空",
    );
  });

  it("should reject missing departmentId", () => {
    expect(() => departmentIdSchema.parse({})).toThrow();
  });
});

describe("doctorIdSchema", () => {
  it("should accept a valid doctorId", () => {
    const result = doctorIdSchema.parse({ doctorId: "doctor-456" });
    expect(result.doctorId).toBe("doctor-456");
  });

  it("should reject empty doctorId", () => {
    expect(() => doctorIdSchema.parse({ doctorId: "" })).toThrow(
      "医生ID不能为空",
    );
  });

  it("should reject missing doctorId", () => {
    expect(() => doctorIdSchema.parse({})).toThrow();
  });
});

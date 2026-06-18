import { describe, it, expect } from "vitest";
import { paginationSchema } from "@/shared/utils/common-schema";

describe("paginationSchema", () => {
  it("should apply defaults for empty params", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("should coerce string numbers", () => {
    const result = paginationSchema.parse({ page: "3", pageSize: "20" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(20);
  });

  it("should reject negative page numbers", () => {
    expect(() => paginationSchema.parse({ page: "-1" })).toThrow();
  });

  it("should reject pageSize larger than 100", () => {
    expect(() => paginationSchema.parse({ pageSize: "200" })).toThrow();
  });

  it("should reject zero page numbers", () => {
    expect(() => paginationSchema.parse({ page: "0" })).toThrow();
  });

  it("should accept max boundary values", () => {
    const result = paginationSchema.parse({ page: "999", pageSize: "100" });
    expect(result.page).toBe(999);
    expect(result.pageSize).toBe(100);
  });
});

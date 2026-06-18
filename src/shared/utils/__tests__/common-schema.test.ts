import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseQuery } from "@/shared/utils/common-schema";

const testSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  age: z.coerce.number().int().positive().default(18),
});

describe("parseQuery", () => {
  it("should parse valid URLSearchParams correctly", () => {
    const params = new URLSearchParams({ name: "张三", age: "25" });
    const result = parseQuery(testSchema, params);
    expect(result.name).toBe("张三");
    expect(result.age).toBe(25);
  });

  it("should apply default values for missing optional fields", () => {
    const params = new URLSearchParams({ name: "李四" });
    const result = parseQuery(testSchema, params);
    expect(result.name).toBe("李四");
    expect(result.age).toBe(18);
  });

  it("should throw an error when validation fails", () => {
    const params = new URLSearchParams({ name: "", age: "abc" });
    expect(() => parseQuery(testSchema, params)).toThrow();
  });

  it("should throw the first validation issue message", () => {
    const params = new URLSearchParams({ name: "" });
    expect(() => parseQuery(testSchema, params)).toThrow("名称不能为空");
  });

  it("should handle multiple query parameters", () => {
    const params = new URLSearchParams("name=王五&age=30");
    const result = parseQuery(testSchema, params);
    expect(result.name).toBe("王五");
    expect(result.age).toBe(30);
  });
});

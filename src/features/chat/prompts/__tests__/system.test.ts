import { describe, it, expect } from "vitest";
import { getSystemPrompt, SYSTEM_PROMPT } from "../system";

describe("system prompt", () => {
  it("should return base prompt when no user provided", () => {
    const result = getSystemPrompt();
    expect(result).toContain("健康挂号");
    expect(result).toContain("未登录");
  });

  it("should indicate authenticated status when user is logged in", () => {
    const result = getSystemPrompt({ isAuthenticated: true, name: "张三" });
    expect(result).toContain("已登录");
    expect(result).toContain("张三");
  });

  it("should indicate guest status when user is not logged in", () => {
    const result = getSystemPrompt({ isAuthenticated: false });
    expect(result).toContain("未登录（游客）");
  });

  it("should inject memory when provided", () => {
    const result = getSystemPrompt({ memory: "用户偏好: 常去医院为协和医院" });
    expect(result).toContain("用户偏好");
    expect(result).toContain("协和医院");
  });

  it("should not include memory section when memory is empty", () => {
    const result = getSystemPrompt();
    expect(result).not.toContain("## 用户记忆");
  });

  it("should combine auth status and memory together", () => {
    const result = getSystemPrompt({
      isAuthenticated: true,
      name: "李四",
      memory: "常看科室: 呼吸内科",
    });
    expect(result).toContain("已登录");
    expect(result).toContain("李四");
    expect(result).toContain("呼吸内科");
  });

  it("should export SYSTEM_PROMPT as the base prompt", () => {
    expect(SYSTEM_PROMPT).toContain("健康挂号");
    expect(SYSTEM_PROMPT).not.toContain("用户状态");
  });
});

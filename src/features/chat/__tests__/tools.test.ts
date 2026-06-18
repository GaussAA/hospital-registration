import { describe, it, expect, vi, beforeEach } from "vitest";

// Handlers will be mocked via the module system
vi.mock("@/features/chat/tools/handlers/hospital", () => ({
  handleSearchHospitals: vi.fn().mockResolvedValue("mock hospital result"),
  handleGetHospitalDetail: vi.fn().mockResolvedValue("mock hospital detail"),
}));

vi.mock("@/features/chat/tools/handlers/department", () => ({
  handleSearchDepartments: vi.fn().mockResolvedValue("mock department result"),
  handleRecommendDepartment: vi.fn().mockResolvedValue("mock recommend result"),
}));

vi.mock("@/features/chat/tools/handlers/doctor", () => ({
  handleSearchDoctors: vi.fn().mockResolvedValue("mock doctor result"),
  handleGetDoctorDetail: vi.fn().mockResolvedValue("mock doctor detail"),
}));

vi.mock("@/features/chat/tools/handlers/schedule", () => ({
  handleGetDoctorSchedules: vi.fn().mockResolvedValue("mock schedule result"),
}));

vi.mock("@/features/chat/tools/handlers/registration", () => ({
  handleCreateRegistration: vi.fn().mockResolvedValue("mock registration result"),
  handleListRegistrations: vi.fn().mockResolvedValue("mock list result"),
  handleCancelRegistration: vi.fn().mockResolvedValue("mock cancel result"),
}));

vi.mock("@/features/chat/tools/handlers/profile", () => ({
  handleGetPatientProfiles: vi.fn().mockResolvedValue("mock profiles result"),
  handleCreatePatientProfile: vi.fn().mockResolvedValue("mock create profile result"),
}));

vi.mock("@/features/chat/tools/handlers/guide", () => ({
  handleGetRegistrationGuide: vi.fn().mockResolvedValue("mock guide result"),
  handleAnalyzeImage: vi.fn().mockResolvedValue("mock analyze result"),
}));

// Import the module under test (after all mocks)
import toolDefs, { toolsToFunctionCalling, tools } from "@/features/chat/tools/registry";
import type { ToolDefinition, FunctionCallTool, ToolContext } from "@/features/chat/types";

describe("tools/registry.ts", () => {
  const mockContext: ToolContext = { userId: "test-user", userRole: "user" };

  describe("toolDefs (default export)", () => {
    it("should be an array of ToolDefinitions", () => {
      expect(Array.isArray(toolDefs)).toBe(true);
    });

    it("should have at least 13 tool definitions", () => {
      expect(toolDefs.length).toBeGreaterThanOrEqual(13);
    });

    it("should contain search_hospitals tool", () => {
      const tool = toolDefs.find((t) => t.name === "search_hospitals");
      expect(tool).toBeDefined();
      expect(tool!.description).toContain("搜索医院");
      expect(tool!.parameters).toHaveProperty("keyword");
      expect(tool!.parameters).toHaveProperty("city");
      expect(tool!.parameters).toHaveProperty("level");
    });

    it("should contain create_registration tool with required params", () => {
      const tool = toolDefs.find((t) => t.name === "create_registration");
      expect(tool).toBeDefined();
      expect(tool!.parameters.scheduleId.required).toBe(true);
      expect(tool!.parameters.profileId.required).toBe(true);
      expect(tool!.parameters.type.required).toBe(true);
      expect(tool!.parameters.type.enum).toEqual(["normal", "expert", "special"]);
    });

    it("should contain analyze_image tool", () => {
      const tool = toolDefs.find((t) => t.name === "analyze_image");
      expect(tool).toBeDefined();
      expect(tool!.parameters.imageUrl.required).toBe(true);
    });

    it("should have a valid handler function for each tool", () => {
      for (const t of toolDefs) {
        expect(typeof t.handler).toBe("function");
      }
    });
  });

  describe("tools (named export)", () => {
    it("should be the same array as toolDefs (default export)", () => {
      expect(tools).toBe(toolDefs);
    });
  });

  describe("toolsToFunctionCalling", () => {
    it("should convert all tool definitions to FunctionCallTool format", () => {
      const result = toolsToFunctionCalling();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(toolDefs.length);
    });

    it("should have type='function' for all converted tools", () => {
      const result = toolsToFunctionCalling();

      for (const t of result) {
        expect(t.type).toBe("function");
      }
    });

    it("should correctly format search_hospitals as FunctionCallTool", () => {
      const result = toolsToFunctionCalling();
      const searchTool = result.find((t) => t.function.name === "search_hospitals");

      expect(searchTool).toBeDefined();
      expect(searchTool!.function.description).toContain("搜索医院");
      expect(searchTool!.function.parameters.type).toBe("object");
      expect(searchTool!.function.parameters.properties).toHaveProperty("keyword");
      expect(searchTool!.function.parameters.properties).toHaveProperty("city");
      expect(searchTool!.function.parameters.properties).toHaveProperty("level");
      // All params for search_hospitals are optional, so required should be empty
      expect(searchTool!.function.parameters.required).toEqual([]);
    });

    it("should correctly set required fields for create_registration", () => {
      const result = toolsToFunctionCalling();
      const createTool = result.find((t) => t.function.name === "create_registration");

      expect(createTool).toBeDefined();
      expect(createTool!.function.parameters.required).toContain("scheduleId");
      expect(createTool!.function.parameters.required).toContain("profileId");
      expect(createTool!.function.parameters.required).toContain("type");
    });

    it("should include enum values in the converted parameters", () => {
      const result = toolsToFunctionCalling();
      const createTool = result.find((t) => t.function.name === "create_registration");

      const typeParam = createTool!.function.parameters.properties["type"] as Record<string, unknown>;
      expect(typeParam.enum).toEqual(["normal", "expert", "special"]);
    });
  });
});

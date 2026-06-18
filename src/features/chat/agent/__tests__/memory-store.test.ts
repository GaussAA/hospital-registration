import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma models ──
const mockUserMemoryFindUnique = vi.fn();
const mockUserMemoryUpsert = vi.fn();
const mockSessionStateFindUnique = vi.fn();
const mockSessionStateUpsert = vi.fn();
const mockSessionStateDelete = vi.fn();
const mockSessionStateDeleteMany = vi.fn();

const mockPrisma = {
  userMemory: {
    findUnique: mockUserMemoryFindUnique,
    upsert: mockUserMemoryUpsert,
  },
  sessionState: {
    findUnique: mockSessionStateFindUnique,
    upsert: mockSessionStateUpsert,
    delete: mockSessionStateDelete,
    deleteMany: mockSessionStateDeleteMany,
  },
};

// Mock @/shared/db before importing modules under test
vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

import { UserMemoryStore, SessionMemoryStore } from "@/features/chat/agent/memory-store";
import type { UserPreference, UserMemory, SessionMemory } from "@/features/chat/agent/memory-store";

/* ── UserMemoryStore ── */

describe("UserMemoryStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── get ──
  describe("get", () => {
    it("should return UserMemory when record exists", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: ["dept-1"],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify(["用户首次就诊", "偏好儿科"]),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.get("user-1");

      expect(result).not.toBeNull();
      expect(result!.userId).toBe("user-1");
      expect(result!.preferences.preferredDepartments).toEqual(["dept-1"]);
      expect(result!.summary).toEqual(["用户首次就诊", "偏好儿科"]);
      expect(result!.lastActive).toEqual(new Date("2025-01-01T00:00:00Z"));
      expect(mockUserMemoryFindUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
    });

    it("should handle preferences that are already parsed objects", async () => {
      const record = {
        userId: "user-2",
        preferences: {
          preferredDepartments: ["dept-2"],
          preferredHospitals: ["hospital-1"],
          recentSearches: ["感冒"],
          settings: { preferExpertRegistration: true },
        },
        summary: ["summary1"],
        updatedAt: new Date("2025-01-02T00:00:00Z"),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.get("user-2");

      expect(result).not.toBeNull();
      expect(result!.preferences.preferredDepartments).toEqual(["dept-2"]);
      expect(result!.preferences.settings.preferExpertRegistration).toBe(true);
      expect(result!.summary).toEqual(["summary1"]);
    });

    it("should return null when record not found", async () => {
      mockUserMemoryFindUnique.mockResolvedValue(null);

      const result = await UserMemoryStore.get("unknown-user");

      expect(result).toBeNull();
      expect(mockUserMemoryFindUnique).toHaveBeenCalledWith({
        where: { userId: "unknown-user" },
      });
    });

    it("should return null when userMemory model is undefined", async () => {
      // Simulate the model not being available at all
      const prismaWithoutMemory = {};
      vi.mocked(require("@/shared/db").getPrisma).mockResolvedValueOnce(prismaWithoutMemory);

      const result = await UserMemoryStore.get("user-1");

      expect(result).toBeNull();
    });

    it("should return null when an exception occurs", async () => {
      mockUserMemoryFindUnique.mockRejectedValue(new Error("DB connection failed"));

      const result = await UserMemoryStore.get("user-1");

      expect(result).toBeNull();
    });

    it("should handle missing summary gracefully", async () => {
      const record = {
        userId: "user-3",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: null,
        updatedAt: new Date("2025-01-03T00:00:00Z"),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.get("user-3");

      expect(result).not.toBeNull();
      expect(result!.summary).toEqual([]);
    });
  });

  // ── save ──
  describe("save", () => {
    it("should upsert user memory successfully", async () => {
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      const memory: UserMemory = {
        userId: "user-1",
        preferences: {
          preferredDepartments: ["dept-1"],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        },
        summary: ["测试摘要"],
        lastActive: new Date(),
      };

      await UserMemoryStore.save("user-1", memory);

      expect(mockUserMemoryUpsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        update: {
          preferences: JSON.stringify(memory.preferences),
          summary: JSON.stringify(memory.summary),
        },
        create: {
          userId: "user-1",
          preferences: JSON.stringify(memory.preferences),
          summary: JSON.stringify(memory.summary),
        },
      });
    });

    it("should handle empty summary when creating", async () => {
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      const memory: UserMemory = {
        userId: "user-2",
        preferences: {
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        },
        summary: [],
        lastActive: new Date(),
      };

      await UserMemoryStore.save("user-2", memory);

      expect(mockUserMemoryUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            summary: JSON.stringify([]),
          }),
        })
      );
    });

    it("should silently fail when prisma throws", async () => {
      mockUserMemoryUpsert.mockRejectedValue(new Error("DB error"));

      const memory: UserMemory = {
        userId: "user-1",
        preferences: {
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        },
        summary: [],
        lastActive: new Date(),
      };

      // Should not throw
      await expect(UserMemoryStore.save("user-1", memory)).resolves.toBeUndefined();
    });

    it("should silently fail when getPrisma throws", async () => {
      vi.mocked(require("@/shared/db").getPrisma).mockRejectedValueOnce(new Error("Init failed"));

      const memory: UserMemory = {
        userId: "user-1",
        preferences: {
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        },
        summary: [],
        lastActive: new Date(),
      };

      await expect(UserMemoryStore.save("user-1", memory)).resolves.toBeUndefined();
    });
  });

  // ── updatePreferences ──
  describe("updatePreferences", () => {
    it("should merge updates into existing preferences", async () => {
      const existingRecord = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: ["dept-1"],
          preferredHospitals: ["hospital-1"],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify([]),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };
      mockUserMemoryFindUnique.mockResolvedValue(existingRecord);
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      await UserMemoryStore.updatePreferences("user-1", {
        preferredHospitals: ["hospital-2"],
        settings: { preferMorningSlots: true },
      });

      // Verify the merge happened correctly by checking upsert was called with merged preferences
      expect(mockUserMemoryUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
          update: expect.objectContaining({
            preferences: JSON.stringify({
              preferredDepartments: ["dept-1"],
              preferredHospitals: ["hospital-2"],
              recentSearches: [],
              settings: { preferMorningSlots: true },
            }),
          }),
          create: expect.objectContaining({
            userId: "user-1",
          }),
        })
      );
    });

    it("should create new record when no existing memory", async () => {
      mockUserMemoryFindUnique.mockResolvedValue(null);
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      await UserMemoryStore.updatePreferences("new-user", {
        preferredDepartments: ["dept-1"],
      });

      expect(mockUserMemoryUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "new-user" },
          create: expect.objectContaining({
            userId: "new-user",
            preferences: JSON.stringify({
              preferredDepartments: ["dept-1"],
              preferredHospitals: [],
              recentSearches: [],
              settings: {},
            }),
            summary: JSON.stringify([]),
          }),
        })
      );
    });
  });

  // ── addSummary ──
  describe("addSummary", () => {
    it("should add a summary entry to existing memory", async () => {
      const existingRecord = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify(["已有摘要"]),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };
      mockUserMemoryFindUnique.mockResolvedValue(existingRecord);
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      await UserMemoryStore.addSummary("user-1", "新增摘要");

      expect(mockUserMemoryUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            summary: JSON.stringify(["已有摘要", "新增摘要"]),
          }),
        })
      );
    });

    it("should create new memory with the entry when no existing memory", async () => {
      mockUserMemoryFindUnique.mockResolvedValue(null);
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      await UserMemoryStore.addSummary("new-user", "第一条摘要");

      expect(mockUserMemoryUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "new-user" },
          create: expect.objectContaining({
            userId: "new-user",
            preferences: JSON.stringify({
              preferredDepartments: [],
              preferredHospitals: [],
              recentSearches: [],
              settings: {},
            }),
            summary: JSON.stringify(["第一条摘要"]),
          }),
        })
      );
    });

    it("should keep only the last 10 summary entries", async () => {
      const existingSummaries = Array.from({ length: 9 }, (_, i) => `摘要${i + 1}`);
      const existingRecord = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify(existingSummaries),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };
      mockUserMemoryFindUnique.mockResolvedValue(existingRecord);
      mockUserMemoryUpsert.mockResolvedValue(undefined);

      await UserMemoryStore.addSummary("user-1", "第10条");

      expect(mockUserMemoryUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            summary: JSON.stringify([...existingSummaries, "第10条"]),
          }),
        })
      );

      // Now add one more to exceed 10
      mockUserMemoryFindUnique.mockResolvedValueOnce({
        ...existingRecord,
        summary: JSON.stringify([...existingSummaries, "第10条"]),
      });

      await UserMemoryStore.addSummary("user-1", "第11条");

      // Should have removed the first one (摘要1)
      const upsertCall = mockUserMemoryUpsert.mock.calls[1][0];
      const savedSummary = JSON.parse(upsertCall.update.summary);
      expect(savedSummary).toHaveLength(10);
      expect(savedSummary[0]).toBe("摘要2");
      expect(savedSummary[savedSummary.length - 1]).toBe("第11条");
    });
  });

  // ── buildMemoryPrompt ──
  describe("buildMemoryPrompt", () => {
    it("should return empty string when no memory exists", async () => {
      mockUserMemoryFindUnique.mockResolvedValue(null);

      const result = await UserMemoryStore.buildMemoryPrompt("unknown-user");

      expect(result).toBe("");
    });

    it("should include preferred hospitals in the prompt", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: ["北京协和医院", "北京大学第一医院"],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify([]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).toContain("常去医院: 北京协和医院、北京大学第一医院");
      expect(result).not.toContain("常看科室");
    });

    it("should include preferred departments", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: ["儿科", "呼吸科"],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify([]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).toContain("常看科室: 儿科、呼吸科");
    });

    it("should include preference settings when enabled", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {
            preferExpertRegistration: true,
            preferMorningSlots: true,
          },
        }),
        summary: JSON.stringify([]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).toContain("偏好专家号");
      expect(result).toContain("偏好上午时段");
    });

    it("should not include settings that are disabled", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {
            preferExpertRegistration: false,
            preferMorningSlots: false,
          },
        }),
        summary: JSON.stringify([]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).not.toContain("偏好专家号");
      expect(result).not.toContain("偏好上午时段");
    });

    it("should include last 3 summary entries", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: ["儿科"],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify(["摘要1", "摘要2", "摘要3", "摘要4", "摘要5"]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).toContain("历史诊疗摘要");
      // Should only include last 3
      expect(result).toContain("摘要3");
      expect(result).toContain("摘要4");
      expect(result).toContain("摘要5");
      expect(result).not.toContain("摘要1");
      expect(result).not.toContain("摘要2");
    });

    it("should build a complete prompt with all available info", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: ["儿科"],
          preferredHospitals: ["儿童医院"],
          recentSearches: ["发烧"],
          settings: {
            preferExpertRegistration: true,
          },
        }),
        summary: JSON.stringify(["孩子对青霉素过敏"]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).toContain("## 用户记忆");
      expect(result).toContain("常去医院: 儿童医院");
      expect(result).toContain("常看科室: 儿科");
      expect(result).toContain("偏好专家号");
      expect(result).toContain("历史诊疗摘要: 孩子对青霉素过敏");
    });

    it("should return empty string when memory has no preferences or summaries", async () => {
      const record = {
        userId: "user-1",
        preferences: JSON.stringify({
          preferredDepartments: [],
          preferredHospitals: [],
          recentSearches: [],
          settings: {},
        }),
        summary: JSON.stringify([]),
        updatedAt: new Date(),
      };
      mockUserMemoryFindUnique.mockResolvedValue(record);

      const result = await UserMemoryStore.buildMemoryPrompt("user-1");

      expect(result).toBe("");
    });
  });
});

/* ── SessionMemoryStore ── */

describe("SessionMemoryStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── get ──
  describe("get", () => {
    it("should return SessionMemory when record exists", async () => {
      const record = {
        sessionId: "session-1",
        step: "selecting_hospital",
        contextSummary: "用户正在选择医院",
        cache: JSON.stringify({ hospitalId: "h-1", _estimatedTokens: 50 }),
      };
      mockSessionStateFindUnique.mockResolvedValue(record);

      const result = await SessionMemoryStore.get("session-1");

      expect(result).not.toBeNull();
      expect(result!.step).toBe("selecting_hospital");
      expect(result!.contextSummary).toBe("用户正在选择医院");
      expect(result!.cache).toEqual({ hospitalId: "h-1" });
      expect(result!.estimatedTokens).toBe(50);
      expect(mockSessionStateFindUnique).toHaveBeenCalledWith({
        where: { sessionId: "session-1" },
      });
    });

    it("should return default values when record has empty fields", async () => {
      const record = {
        sessionId: "session-1",
        step: null,
        contextSummary: null,
        cache: "{}",
      };
      mockSessionStateFindUnique.mockResolvedValue(record);

      const result = await SessionMemoryStore.get("session-1");

      expect(result).not.toBeNull();
      expect(result!.step).toBe("idle");
      expect(result!.contextSummary).toBe("");
      expect(result!.cache).toEqual({});
      expect(result!.estimatedTokens).toBe(0);
    });

    it("should return null when record not found", async () => {
      mockSessionStateFindUnique.mockResolvedValue(null);

      const result = await SessionMemoryStore.get("unknown-session");

      expect(result).toBeNull();
    });

    it("should return null when an exception occurs", async () => {
      mockSessionStateFindUnique.mockRejectedValue(new Error("DB error"));

      const result = await SessionMemoryStore.get("session-1");

      expect(result).toBeNull();
    });

    it("should handle malformed cache JSON", async () => {
      const record = {
        sessionId: "session-1",
        step: "idle",
        contextSummary: "",
        cache: "{invalid-json}",
      };
      mockSessionStateFindUnique.mockResolvedValue(record);

      const result = await SessionMemoryStore.get("session-1");

      expect(result).not.toBeNull();
      expect(result!.cache).toEqual({});
      expect(result!.estimatedTokens).toBe(0);
    });
  });

  // ── set ──
  describe("set", () => {
    it("should upsert session memory with cache metadata", async () => {
      mockSessionStateUpsert.mockResolvedValue(undefined);

      const memory: SessionMemory = {
        contextSummary: "选择科室中",
        step: "selecting_department",
        cache: { departmentId: "dept-1" },
        estimatedTokens: 30,
      };

      await SessionMemoryStore.set("session-1", memory);

      expect(mockSessionStateUpsert).toHaveBeenCalledWith({
        where: { sessionId: "session-1" },
        update: {
          step: "selecting_department",
          cache: JSON.stringify({ departmentId: "dept-1", _estimatedTokens: 30 }),
          contextSummary: "选择科室中",
        },
        create: {
          sessionId: "session-1",
          step: "selecting_department",
          cache: JSON.stringify({ departmentId: "dept-1", _estimatedTokens: 30 }),
          contextSummary: "选择科室中",
        },
      });
    });

    it("should silently fail when prisma throws", async () => {
      mockSessionStateUpsert.mockRejectedValue(new Error("DB error"));

      const memory: SessionMemory = {
        contextSummary: "",
        step: "idle",
        cache: {},
        estimatedTokens: 0,
      };

      await expect(SessionMemoryStore.set("session-1", memory)).resolves.toBeUndefined();
    });
  });

  // ── update ──
  describe("update", () => {
    it("should merge updates into existing session memory", async () => {
      const existingRecord = {
        sessionId: "session-1",
        step: "idle",
        contextSummary: "",
        cache: JSON.stringify({ _estimatedTokens: 0 }),
      };
      mockSessionStateFindUnique.mockResolvedValue(existingRecord);
      mockSessionStateUpsert.mockResolvedValue(undefined);

      await SessionMemoryStore.update("session-1", {
        step: "selecting_hospital",
        cache: { hospitalId: "h-1" },
        estimatedTokens: 10,
      });

      expect(mockSessionStateUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: "session-1" },
          update: expect.objectContaining({
            step: "selecting_hospital",
            cache: JSON.stringify({ hospitalId: "h-1", _estimatedTokens: 10 }),
          }),
        })
      );
    });

    it("should create new session memory with defaults when none exists", async () => {
      mockSessionStateFindUnique.mockResolvedValue(null);
      mockSessionStateUpsert.mockResolvedValue(undefined);

      await SessionMemoryStore.update("new-session", {
        step: "selecting_doctor",
      });

      expect(mockSessionStateUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: "new-session" },
          create: expect.objectContaining({
            sessionId: "new-session",
            step: "selecting_doctor",
            contextSummary: "",
            cache: JSON.stringify({ _estimatedTokens: 0 }),
          }),
        })
      );
    });

    it("should preserve existing cache fields when updating with new cache", async () => {
      const existingRecord = {
        sessionId: "session-1",
        step: "selecting_hospital",
        contextSummary: "用户选了医院",
        cache: JSON.stringify({ hospitalId: "h-1", doctorId: "d-1", _estimatedTokens: 20 }),
      };
      mockSessionStateFindUnique.mockResolvedValue(existingRecord);
      mockSessionStateUpsert.mockResolvedValue(undefined);

      await SessionMemoryStore.update("session-1", {
        step: "confirmed",
      });

      // The update should use Object.assign on the full SessionMemory object,
      // so cache from get should be correctly passed through
      expect(mockSessionStateUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            step: "confirmed",
            cache: JSON.stringify({ hospitalId: "h-1", doctorId: "d-1", _estimatedTokens: 20 }),
          }),
        })
      );
    });
  });

  // ── delete ──
  describe("delete", () => {
    it("should delete session memory by sessionId", async () => {
      mockSessionStateDelete.mockResolvedValue(undefined);

      await SessionMemoryStore.delete("session-1");

      expect(mockSessionStateDelete).toHaveBeenCalledWith({
        where: { sessionId: "session-1" },
      });
    });

    it("should silently fail when record does not exist", async () => {
      mockSessionStateDelete.mockRejectedValue(new Error("Record not found"));

      await expect(SessionMemoryStore.delete("session-1")).resolves.toBeUndefined();
    });

    it("should handle delete when sessionState model is undefined", async () => {
      // delete uses optional chaining, so undefined model is OK
      const prismaWithoutSession = {};
      vi.mocked(require("@/shared/db").getPrisma).mockResolvedValueOnce(prismaWithoutSession);

      await expect(SessionMemoryStore.delete("session-1")).resolves.toBeUndefined();
    });

    it("should silently fail when prisma throws", async () => {
      mockSessionStateDelete.mockRejectedValue(new Error("DB error"));

      await expect(SessionMemoryStore.delete("session-1")).resolves.toBeUndefined();
    });
  });

  // ── clear ──
  describe("clear", () => {
    it("should delete all session states", async () => {
      mockSessionStateDeleteMany.mockResolvedValue(undefined);

      await SessionMemoryStore.clear();

      expect(mockSessionStateDeleteMany).toHaveBeenCalledWith();
    });

    it("should silently fail when prisma throws", async () => {
      mockSessionStateDeleteMany.mockRejectedValue(new Error("DB error"));

      await expect(SessionMemoryStore.clear()).resolves.toBeUndefined();
    });

    it("should handle clear when sessionState model is undefined", async () => {
      const prismaWithoutSession = {};
      vi.mocked(require("@/shared/db").getPrisma).mockResolvedValueOnce(prismaWithoutSession);

      await expect(SessionMemoryStore.clear()).resolves.toBeUndefined();
    });
  });
});

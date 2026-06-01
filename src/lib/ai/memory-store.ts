import { getPrisma } from "@/lib/db";

/**
 * 长期用户记忆存储。
 *
 * 存储三层记忆：
 * 1. 用户偏好（偏好科室、常去医院、就诊人习惯）
 * 2. 对话摘要（跨对话的关键信息提取）
 * 3. 会话级上下文（当前对话的步骤状态和缓存）
 */

export interface UserPreference {
  /** 用户常去的科室 ID 列表 */
  preferredDepartments: string[];
  /** 用户常去的医院 ID 列表 */
  preferredHospitals: string[];
  /** 最近搜索的关键词 */
  recentSearches: string[];
  /** 用户偏好设置 */
  settings: {
    preferExpertRegistration?: boolean;
    preferMorningSlots?: boolean;
  };
}

export interface UserMemory {
  userId: string;
  preferences: UserPreference;
  /** 跨对话积累的知识摘要 */
  summary: string[];
  /** 最后活跃时间 */
  lastActive: Date;
}

/** 会话级短期记忆 */
export interface SessionMemory {
  /** 上下文摘要（当前对话的重要信息） */
  contextSummary: string;
  /** 步骤状态 */
  step: string;
  /** 缓存数据（医院、科室、医生、排班选择等） */
  cache: Record<string, unknown>;
  /** token 估计计数 */
  estimatedTokens: number;
}

/* ── User Memory Store ── */

export class UserMemoryStore {
  /**
   * 获取用户长期记忆。
   * 记忆通过 Prisma 持久化，会话启动时加载。
   */
  static async get(userId: string): Promise<UserMemory | null> {
    try {
      const prisma = await getPrisma();

      // 走 json 字段方法：把偏好序列化为字符串存到 User 模型或者创建一个新模型
      // 由于 Prisma Schema 没有 memory 字段，使用一个独立的内存模型
      // 此处通过 user 记录扩展实现
      const memRecord = await (prisma as unknown as { userMemory?: { findUnique: (args: { where: { userId: string } }) => Promise<Record<string, unknown> | null> } }).userMemory?.findUnique({
        where: { userId },
      });

      if (!memRecord) return null;

      return {
        userId: memRecord.userId as string,
        preferences: typeof memRecord.preferences === "string"
          ? JSON.parse(memRecord.preferences as string)
          : memRecord.preferences,
        summary: typeof memRecord.summary === "string"
          ? JSON.parse(memRecord.summary as string)
          : (memRecord.summary ?? []) as string[],
        lastActive: (memRecord.updatedAt as Date) ?? new Date(),
      };
    } catch {
      return null;
    }
  }

  /**
   * 保存用户长期记忆。
   */
  static async save(userId: string, memory: UserMemory): Promise<void> {
    try {
      const prisma = await getPrisma();

      await (prisma as unknown as { userMemory: { upsert: (args: { where: { userId: string }, update: Record<string, unknown>, create: Record<string, unknown> }) => Promise<void> } }).userMemory.upsert({
        where: { userId },
        update: {
          preferences: JSON.stringify(memory.preferences),
          summary: JSON.stringify(memory.summary),
        },
        create: {
          userId,
          preferences: JSON.stringify(memory.preferences),
          summary: JSON.stringify(memory.summary ?? []),
        },
      });
    } catch {
      // Memory store failure is non-critical
    }
  }

  /**
   * 更新用户偏好（例如记录用户新选的科室）。
   */
  static async updatePreferences(
    userId: string,
    updates: Partial<UserPreference>
  ): Promise<void> {
    const existing = await UserMemoryStore.get(userId);
    if (!existing) {
      const defaultPrefs: UserPreference = {
        preferredDepartments: [],
        preferredHospitals: [],
        recentSearches: [],
        settings: {},
      };
      await UserMemoryStore.save(userId, {
        userId,
        preferences: { ...defaultPrefs, ...updates },
        summary: [],
        lastActive: new Date(),
      });
      return;
    }

    existing.preferences = { ...existing.preferences, ...updates };
    existing.lastActive = new Date();
    await UserMemoryStore.save(userId, existing);
  }

  /**
   * 添加一条摘要到用户长期记忆。
   */
  static async addSummary(userId: string, entry: string): Promise<void> {
    const existing = await UserMemoryStore.get(userId);
    if (!existing) {
      const defaultPrefs: UserPreference = {
        preferredDepartments: [],
        preferredHospitals: [],
        recentSearches: [],
        settings: {},
      };
      await UserMemoryStore.save(userId, {
        userId,
        preferences: defaultPrefs,
        summary: [entry],
        lastActive: new Date(),
      });
      return;
    }

    // 保留最近 10 条摘要
    existing.summary = [...existing.summary, entry].slice(-10);
    existing.lastActive = new Date();
    await UserMemoryStore.save(userId, existing);
  }

  /**
   * 生成植入系统提示中的记忆文本。
   */
  static async buildMemoryPrompt(userId: string): Promise<string> {
    const memory = await UserMemoryStore.get(userId);
    if (!memory) return "";

    const parts: string[] = [];

    const prefs = memory.preferences;
    if (prefs.preferredHospitals.length > 0) {
      parts.push(`常去医院: ${prefs.preferredHospitals.join("、")}`);
    }
    if (prefs.preferredDepartments.length > 0) {
      parts.push(`常看科室: ${prefs.preferredDepartments.join("、")}`);
    }
    if (prefs.settings.preferExpertRegistration) {
      parts.push("偏好专家号");
    }
    if (prefs.settings.preferMorningSlots) {
      parts.push("偏好上午时段");
    }
    if (memory.summary.length > 0) {
      parts.push(`历史诊疗摘要: ${memory.summary.slice(-3).join("; ")}`);
    }

    return parts.length > 0 ? `## 用户记忆\n${parts.join("\n")}` : "";
  }
}

/* ── Session Memory Store (DB-backed via SessionState table) ── */

export class SessionMemoryStore {
  /**
   * 从 DB SessionState 表加载会话状态。
   */
  static async get(sessionId: string): Promise<SessionMemory | null> {
    try {
      const prisma = await getPrisma();
      const record = await (prisma as unknown as { sessionState?: { findUnique: (args: { where: { sessionId: string } }) => Promise<Record<string, unknown> | null> } }).sessionState?.findUnique({
        where: { sessionId },
      });
      if (!record) return null;

      let cache: Record<string, unknown> = {};
      try {
        cache = JSON.parse(typeof record.cache === "string" ? record.cache : "{}");
      } catch {}

      // estimatedTokens may be stored inside cache
      const estimatedTokens = (cache._estimatedTokens as number) || 0;
      delete cache._estimatedTokens;

      return {
        contextSummary: (record.contextSummary as string) || "",
        step: (record.step as string) || "idle",
        cache,
        estimatedTokens,
      };
    } catch {
      return null;
    }
  }

  /**
   * 将会话状态写入 DB SessionState 表（upsert）。
   */
  static async set(sessionId: string, memory: SessionMemory): Promise<void> {
    try {
      const prisma = await getPrisma();
      const cacheWithMeta = {
        ...memory.cache,
        _estimatedTokens: memory.estimatedTokens,
      };

      await (prisma as unknown as { sessionState: { upsert: (args: { where: { sessionId: string }, update: Record<string, unknown>, create: Record<string, unknown> }) => Promise<void> } }).sessionState.upsert({
        where: { sessionId },
        update: {
          step: memory.step,
          cache: JSON.stringify(cacheWithMeta),
          contextSummary: memory.contextSummary || "",
        },
        create: {
          sessionId,
          step: memory.step,
          cache: JSON.stringify(cacheWithMeta),
          contextSummary: memory.contextSummary || "",
        },
      });
    } catch {
      // Session memory failure is non-critical
    }
  }

  /**
   * 合并更新会话状态。
   */
  static async update(sessionId: string, updates: Partial<SessionMemory>): Promise<void> {
    const existing = await SessionMemoryStore.get(sessionId);
    if (existing) {
      Object.assign(existing, updates);
      await SessionMemoryStore.set(sessionId, existing);
    } else {
      // Create new with defaults merged with updates
      const newMemory: SessionMemory = {
        contextSummary: "",
        step: "idle",
        cache: {},
        estimatedTokens: 0,
        ...updates,
      };
      await SessionMemoryStore.set(sessionId, newMemory);
    }
  }

  /**
   * 删除会话状态。
   */
  static async delete(sessionId: string): Promise<void> {
    try {
      const prisma = await getPrisma();
      await (prisma as unknown as { sessionState: { delete: (args: { where: { sessionId: string } }) => Promise<void> } }).sessionState?.delete({
        where: { sessionId },
      }).catch(() => {});
    } catch {
      // non-critical
    }
  }

  /**
   * 清除所有会话状态（仅在调试/测试时使用）。
   */
  static async clear(): Promise<void> {
    try {
      const prisma = await getPrisma();
      await (prisma as unknown as { sessionState: { deleteMany: () => Promise<void> } }).sessionState?.deleteMany();
    } catch {
      // non-critical
    }
  }
}

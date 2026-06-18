import "server-only";

/**
 * Redis 缓存模块
 *
 * 提供 Redis 客户端单例和缓存工具函数，采用 Cache-Aside 模式。
 * 适用于高频只读数据缓存（医院列表、科室、医生、排班等）。
 */
import { createClient, type RedisClientType } from "redis";
import { env } from "@/shared/env";

// ── 缓存键命名空间 ───────────────────────────────────────────────────────
export const CACHE_KEYS = {
  HOSPITALS_LIST: "hospitals:list",
  HOSPITAL_DETAIL: (id: string) => `hospitals:detail:${id}`,
  DEPARTMENTS_BY_HOSPITAL: (hospitalId: string) => `departments:hospital:${hospitalId}`,
  DEPARTMENT_DETAIL: (id: string) => `departments:detail:${id}`,
  DOCTORS_BY_DEPARTMENT: (departmentId: string) => `doctors:department:${departmentId}`,
  DOCTOR_DETAIL: (id: string) => `doctors:detail:${id}`,
  SCHEDULES_BY_DOCTOR: (doctorId: string) => `schedules:doctor:${doctorId}`,
  PUBLIC_STATS: "stats:public",
} as const;

// ── 默认 TTL 配置（秒）───────────────────────────────────────────────────
export const CACHE_TTL = {
  HOSPITALS: 600,        // 医院列表：10 分钟
  HOSPITAL_DETAIL: 600,  // 医院详情：10 分钟
  DEPARTMENTS: 600,      // 科室列表：10 分钟
  DOCTORS: 300,          // 医生信息：5 分钟
  DOCTOR_DETAIL: 300,    // 医生详情：5 分钟
  SCHEDULES: 60,         // 排班余量：1 分钟
  PUBLIC_STATS: 120,     // 公开统计：2 分钟
} as const;

// ── Redis 客户端单例 ─────────────────────────────────────────────────────
let redis: RedisClientType | null = null;
let redisInitPromise: Promise<RedisClientType> | null = null;

async function initRedis(): Promise<RedisClientType> {
  const client = createClient({ url: env.REDIS_URL });

  client.on("error", (err) => {
    console.error("[Redis] Client error:", err);
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  client.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
  });

  await client.connect();
  return client as RedisClientType;
}

/**
 * 获取 Redis 客户端单例。
 * 首次调用会建立连接，后续复用。
 */
export async function getRedis(): Promise<RedisClientType> {
  if (redis) return redis;
  if (!redisInitPromise) {
    redisInitPromise = initRedis().then((client) => {
      redis = client;
      return client;
    });
  }
  return redisInitPromise;
}

/**
 * 优雅关闭 Redis 连接。
 * 在应用关闭时调用。
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    redisInitPromise = null;
  }
}

// ── 缓存工具函数 ──────────────────────────────────────────────────────────

/**
 * 从缓存获取数据。
 * 如果缓存命中，返回解析后的数据；否则返回 null。
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedis();
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[Cache] Failed to get key "${key}":`, error);
    return null;
  }
}

/**
 * 写入缓存。
 * @param key 缓存键
 * @param data 要缓存的数据（自动 JSON 序列化）
 * @param ttl 过期时间（秒），默认 300
 */
export async function setCache<T>(key: string, data: T, ttl = 300): Promise<void> {
  try {
    const client = await getRedis();
    const serialized = JSON.stringify(data);
    await client.set(key, serialized, { EX: ttl });
  } catch (error) {
    console.error(`[Cache] Failed to set key "${key}":`, error);
  }
}

/**
 * 删除指定缓存键。
 * 用于数据变更时主动失效缓存。
 */
export async function delCache(key: string): Promise<void> {
  try {
    const client = await getRedis();
    await client.del(key);
  } catch (error) {
    console.error(`[Cache] Failed to del key "${key}":`, error);
  }
}

/**
 * 批量删除匹配某个模式的缓存键。
 * 例如 delCacheByPattern("hospitals:*") 清除所有医院相关缓存。
 */
export async function delCacheByPattern(pattern: string): Promise<void> {
  try {
    const client = await getRedis();
    let cursor = "0";
    do {
      const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length > 0) {
        await client.del(result.keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error(`[Cache] Failed to del pattern "${pattern}":`, error);
  }
}

/**
 * Cache-Aside 辅助函数：优先读缓存，未命中则回源查询并回填缓存。
 *
 * @param key 缓存键
 * @param ttl 缓存 TTL（秒）
 * @param fetchFn 回源查询函数（仅在缓存未命中时调用）
 * @returns 缓存或回源获取的数据
 */
export async function cacheAside<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // 尝试从缓存读取
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，回源查询
  const data = await fetchFn();

  // 异步回填缓存（不阻塞返回）
  setCache(key, data, ttl).catch((err) => {
    console.error(`[Cache] Failed to backfill key "${key}":`, err);
  });

  return data;
}

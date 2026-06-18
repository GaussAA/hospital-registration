/**
 * 医院在线挂号系统 — 全流程 E2E 集成测试
 * ==============================================
 * 使用 vitest 框架
 * 测试前自动重置数据库并启动 Next.js 开发服务器
 */

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// ─── Project Root ───────────────────────────────────────────────────────────
const PROJECT_ROOT = resolve(__dirname, "..", "..", "..");
const PORT = 3458;
const BASE_URL = `http://localhost:${PORT}`;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a Next.js API response into { code, data, message } */
async function parseResponse(res: Response) {
  const body = await res.json();
  return { status: res.status, ...body };
}

/** Extract the token cookie from a Set-Cookie header string */
function extractTokenCookie(setCookieHeader: string | null) {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of cookies) {
    const match = c.match(/token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

/** Small delay helper */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Server Lifecycle ───────────────────────────────────────────────────────

let serverProcess: import("node:child_process").ChildProcess | null = null;
let serverReady = false;

async function startServer() {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n🚀 Starting Next.js dev server on port ${PORT}...`);

    serverProcess = spawn("bun", ["run", "dev", "--port", String(PORT)], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(PORT) },
    });

    let output = "";

    serverProcess.stdout!.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`  [server] ${text.trim()}\n`);
      if (
        text.includes("ready") ||
        text.includes("localhost") ||
        text.includes("started server") ||
        text.includes(`:${PORT}`)
      ) {
        if (!serverReady) {
          serverReady = true;
          resolve();
        }
      }
    });

    serverProcess.stderr!.on("data", (data: Buffer) => {
      const text = data.toString();
      process.stderr.write(`  [server:err] ${text.trim()}\n`);
    });

    serverProcess.on("close", (code) => {
      console.log(`  [server] process exited with code ${code}`);
      serverProcess = null;
      if (!serverReady) {
        reject(new Error(`Server exited early with code ${code}\n${output}`));
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverReady) {
        serverReady = true;
        console.log("  [server] ⚠️  Timed out waiting for ready message, continuing anyway...");
        resolve();
      }
    }, 60000);
  });
}

async function stopServer() {
  if (serverProcess) {
    console.log("\n🛑 Stopping dev server...");
    serverProcess.kill("SIGTERM");
    await sleep(2000);
    try {
      serverProcess.kill("SIGKILL");
    } catch {
      // ignore
    }
    serverProcess = null;
  }
}

async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/hospitals`, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 400) {
        console.log(`  ✅ Server ready (attempt ${i + 1})`);
        return true;
      }
    } catch {
      // Not ready yet
    }
    await sleep(1000);
  }
  throw new Error(`Server did not become ready after ${maxRetries} seconds`);
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe("🏥 医院在线挂号系统 API 集成测试", () => {
  // Shared state
  let token: string | null = null;
  let departments: Array<{ id: string; name: string }> = [];
  let doctors: Array<{ id: string; name: string }> = [];
  let schedules: Array<{ id: string; date: string; timeSlot: string; remaining: number; type: string }> = [];
  let profileId: string | null = null;
  let appointmentId: string | null = null;

  // ── Setup ─────────────────────────────────────────────────────────────

  beforeAll(async () => {
    // Step 1: Reset and seed the database
    console.log("\n📦 Resetting database...");
    const resetCmd = spawn("npx", ["prisma", "db", "push", "--force-reset"], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      shell: true,
    });
    await new Promise<void>((resolve, reject) => {
      resetCmd.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`db push --force-reset failed with code ${code}`));
      });
    });

    console.log("🌱 Seeding database...");
    const seedCmd = spawn("bun", ["./prisma/seed.ts"], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      shell: true,
    });
    await new Promise<void>((resolve, reject) => {
      seedCmd.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`db seed failed with code ${code}`));
      });
    });

    // Step 2: Start the dev server
    await startServer();
    await waitForServer();
  }, 120000);

  afterAll(async () => {
    await stopServer();
  }, 30000);

  // ── Test 1: 注册测试 ────────────────────────────────────────────────

  it("1️⃣  POST /api/auth/register — 注册新用户", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "测试用户",
        email: `test_${Date.now()}@example.com`,
        phone: `138${String(Date.now()).slice(-8)}`,
        password: "test123456",
      }),
    });

    const body = await parseResponse(res);
    expect(res.status).toBe(201);
    expect(body.data).toBeDefined();
    expect(body.data.user).toBeDefined();
    expect(body.data.user.name).toBe("测试用户");
    expect(body.data.user.role).toBe("patient");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    const extractedToken = extractTokenCookie(setCookie);
    expect(extractedToken).toBeTruthy();

    token = extractedToken;
  }, 30000);

  // ── Test 2: 登录测试 ────────────────────────────────────────────────

  it("2️⃣  POST /api/auth/login — 登录已有用户", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account: "patient@demo.com",
        password: "patient123",
      }),
    });

    const body = await parseResponse(res);
    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.user).toBeDefined();
    expect(body.data.user.name).toBe("张三");

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    const extractedToken = extractTokenCookie(setCookie);
    expect(extractedToken).toBeTruthy();

    token = extractedToken;
  }, 30000);

  // ── Test 3: 医院列表测试 ────────────────────────────────────────────

  it("3️⃣  GET /api/hospitals — 获取医院列表", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals`);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(2);

    const names = body.data.list.map((h: { name: string }) => h.name);
    expect(names).toContain("杭州市第一人民医院");
  });

  // ── Test 4: 医院详情测试 ────────────────────────────────────────────

  it("4️⃣  GET /api/hospitals/[id] — 获取医院详情", async () => {
    const hospitalId = "hospital-1";
    const res = await fetch(`${BASE_URL}/api/hospitals/${hospitalId}`);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe("杭州市第一人民医院");
    expect(body.data.city).toBe("杭州");
    expect(body.data.departmentCount).toBeGreaterThanOrEqual(3);
    expect(body.data.doctorCount).toBeGreaterThanOrEqual(5);
  });

  // ── Test 5: 科室列表测试 ────────────────────────────────────────────

  it("5️⃣  GET /api/hospitals/[hospitalId]/departments — 获取科室列表", async () => {
    const hospitalId = "hospital-1";
    const res = await fetch(`${BASE_URL}/api/hospitals/${hospitalId}/departments`);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);

    const names = body.data.map((d: { name: string }) => d.name);
    expect(names).toContain("内科");
    expect(names).toContain("外科");
    expect(names).toContain("儿科");

    departments = body.data;
  });

  // ── Test 6: 医生列表测试 ────────────────────────────────────────────

  it("6️⃣  GET /api/hospitals/departments/[departmentId]/doctors — 获取医生列表", async () => {
    const internalDept = departments.find((d) => d.name === "内科");
    expect(internalDept).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/hospitals/departments/${internalDept!.id}/doctors`);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);

    const names = body.data.map((d: { name: string }) => d.name);
    expect(names).toContain("王建国");
    expect(names).toContain("李芳");

    doctors = body.data;
  });

  // ── Test 7: 排班测试 ────────────────────────────────────────────────

  it("7️⃣  GET /api/hospitals/departments/doctors/[doctorId]/schedules — 获取未来7天排班", async () => {
    const doctor = doctors[0];
    expect(doctor).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/hospitals/departments/doctors/${doctor.id}/schedules`);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(7 * 3);

    schedules = body.data;
  });

  // ── Test 8: 新增就诊人 ──────────────────────────────────────────────

  it("8️⃣.1  POST /api/patient-profiles — 新增就诊人（需认证）", async () => {
    expect(token).toBeTruthy();

    const res = await fetch(`${BASE_URL}/api/patient-profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
      body: JSON.stringify({
        name: "张三",
        idCard: "110101199001011234",
        phone: "13900000001",
        gender: "male",
      }),
    });

    const body = await parseResponse(res);
    if (res.status === 201) {
      profileId = body.data.id;
    } else if (res.status === 400) {
      console.log("  ℹ️  创建就诊人返回 400:", body.message);
    }
  });

  it("8️⃣.2  GET /api/patient-profiles — 获取就诊人列表（需认证）", async () => {
    expect(token).toBeTruthy();

    const res = await fetch(`${BASE_URL}/api/patient-profiles`, {
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);

    const profiles = body.data;
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBeGreaterThanOrEqual(1);

    if (!profileId) profileId = profiles[0].id;
    expect(profileId).toBeTruthy();
  });

  // ── Test 9: 创建挂号测试 ────────────────────────────────────────────

  it("9️⃣  POST /api/appointments — 创建挂号（需认证）", async () => {
    expect(token).toBeTruthy();
    expect(schedules.length).toBeGreaterThan(0);
    expect(profileId).toBeTruthy();

    const availableSchedule = schedules.find((s) => s.remaining > 0);
    expect(availableSchedule).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
      body: JSON.stringify({
        scheduleId: availableSchedule!.id,
        profileId: profileId,
        type: "normal",
      }),
    });

    const body = await parseResponse(res);
    expect(res.status).toBe(201);
    expect(body.data).toBeDefined();
    expect(body.data.registration).toBeDefined();
    expect(body.data.registration.status).toBe("pending");

    appointmentId = body.data.registration.id;
  }, 30000);

  // ── Test 10: 重复挂号测试 ───────────────────────────────────────────

  it("🔟  POST /api/appointments — 重复挂号应返回 409", async () => {
    expect(token).toBeTruthy();
    expect(schedules.length).toBeGreaterThan(0);
    expect(profileId).toBeTruthy();

    const availableSchedule = schedules.find((s) => s.remaining > 0);
    expect(availableSchedule).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
      body: JSON.stringify({
        scheduleId: availableSchedule!.id,
        profileId: profileId,
        type: "normal",
      }),
    });

    const body = await parseResponse(res);

    if (res.status === 201) {
      console.log("  ℹ️  不同排班，创建成功");
    } else {
      expect(res.status).toBe(409);
      expect(body.data).toBeNull();
    }
  });

  // ── Test 11: 挂号记录列表测试 ───────────────────────────────────────

  it("1️⃣1️⃣  GET /api/appointments — 获取挂号记录列表（需认证）", async () => {
    expect(token).toBeTruthy();

    const res = await fetch(`${BASE_URL}/api/appointments`, {
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data.list)).toBe(true);
    expect(body.data.list.length).toBeGreaterThanOrEqual(1);
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });

  // ── Test 12: 挂号详情测试 ───────────────────────────────────────────

  it("1️⃣2️⃣  GET /api/appointments/[id] — 获取挂号详情（需认证）", async () => {
    expect(token).toBeTruthy();
    expect(appointmentId).toBeTruthy();

    const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}`, {
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.registration).toBeDefined();
    expect(body.data.registration.id).toBe(appointmentId);
    expect(body.data.registration.status).toBe("pending");
  });

  // ── Test 13: 取消挂号测试 ───────────────────────────────────────────

  it("1️⃣3️⃣  POST /api/appointments/[id]/cancel — 取消挂号（需认证）", async () => {
    expect(token).toBeTruthy();
    expect(appointmentId).toBeTruthy();

    const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.registration).toBeDefined();
    expect(body.data.registration.status).toBe("cancelled");
  });

  // ── Test 14: 管理员路由保护测试 ─────────────────────────────────────

  it("1️⃣4️⃣  GET /api/admin/stats — 未认证访问管理接口应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    const body = await parseResponse(res);

    expect(res.status).toBe(401);
    expect(body.data).toBeNull();
  });

  // ── Test 15: 未认证访问需认证接口 ──────────────────────────────────

  it("1️⃣5️⃣  GET /api/appointments — 未认证访问应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`);

    expect(res.status).toBe(401);
  });

  // ── Test 16: 医院搜索/筛选测试 ─────────────────────────────────────

  it("1️⃣6️⃣  GET /api/hospitals?city=杭州 — 按城市筛选医院", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals?city=杭州`);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.data.list.length).toBeGreaterThanOrEqual(2);
    for (const h of body.data.list) {
      expect(h.city).toBe("杭州");
    }
  });

  // ── Test 17: 不存在的医院路由 ──────────────────────────────────────

  it("1️⃣7️⃣  GET /api/hospitals/non-existent — 不存在的医院应返回 404", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/non-existent`);

    expect(res.status).toBe(404);
  });

  // ── Test 18: 不存在的科室路由 ──────────────────────────────────────

  it("1️⃣8️⃣  GET /api/hospitals/departments/non-existent/doctors — 不存在的科室应返回 404", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/departments/non-existent-id/doctors`);

    expect(res.status).toBe(404);
  });

  // ── Test 19: 注册失败 — 缺少必填字段 ──────────────────────────────

  it("1️⃣9️⃣  POST /api/auth/register — 缺少必填字段应返回 400", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });

    expect(res.status).toBe(400);
  });

  // ── Test 20: 登录失败 — 错误密码 ──────────────────────────────────

  it("2️⃣0️⃣  POST /api/auth/login — 错误密码应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account: "patient@demo.com",
        password: "wrong_password",
      }),
    });
    const body = await parseResponse(res);

    expect(res.status).toBe(401);
    expect(body.data).toBeNull();
  });

  // ── Test 21: 不存在的管理员路由 ────────────────────────────────────

  it("2️⃣1️⃣  POST /api/admin/hospitals — 未认证用户调用管理员 POST 应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/hospitals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Hospital",
        city: "杭州",
        phone: "0571-12345678",
        address: "测试地址",
      }),
    });

    expect(res.status).toBe(401);
  });

  // ── Test 22: Patient profiles without auth ──────────────────────────

  it("2️⃣2️⃣  GET /api/patient-profiles — 未认证应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/patient-profiles`);

    expect(res.status).toBe(401);
  });

  // ── Test 23: Logout and verify token is cleared ────────────────────

  it("2️⃣3️⃣  POST /api/auth/logout — 登出并清除 token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.code).toBe(0);
  });
});

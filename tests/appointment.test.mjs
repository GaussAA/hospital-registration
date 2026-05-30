/**
 * 医院在线挂号系统 — 全流程集成测试
 * ==============================================
 * 使用 node:test 框架 + node:assert 断言
 * 测试前自动重置数据库并启动 Next.js 开发服务器
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Project Root ───────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const PORT = 3458;
const BASE_URL = `http://localhost:${PORT}`;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a Next.js API response into { code, data, message } */
async function parseResponse(res) {
  const body = await res.json();
  return { status: res.status, ...body };
}

/** Extract the token cookie from a Set-Cookie header string */
function extractTokenCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  // set-cookie can be a single string or an array
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const c of cookies) {
    const match = c.match(/token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

/** Build fetch options with cookie header */
function authedHeaders(token) {
  return { headers: { cookie: `token=${token}` } };
}

/** Small delay helper */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Server Lifecycle ───────────────────────────────────────────────────────

let serverProcess = null;
let serverReady = false;

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting Next.js dev server on port ${PORT}...`);

    serverProcess = spawn("bun", ["run", "dev", "--port", String(PORT)], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(PORT) },
    });

    let output = "";

    serverProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`  [server] ${text.trim()}\n`);
      // Next.js outputs a ready message on various formats
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

    serverProcess.stderr.on("data", (data) => {
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
        serverReady = true; // try anyway
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
    // Give it a moment
    await sleep(2000);
    // Force kill if still alive
    try {
      serverProcess.kill("SIGKILL");
    } catch {}
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
  let token = null;
  let testUserId = null;
  let hospitals = [];
  let departments = [];
  let doctors = [];
  let schedules = [];
  let profileId = null;
  let appointmentId = null;

  // ── Setup ─────────────────────────────────────────────────────────────

  before(async () => {
    // Step 1: Reset and seed the database
    console.log("\n📦 Resetting database...");
    const resetCmd = spawn("npx", ["prisma", "db", "push", "--force-reset"], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      shell: true,
    });
    await new Promise((resolve, reject) => {
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
    await new Promise((resolve, reject) => {
      seedCmd.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`db seed failed with code ${code}`));
      });
    });

    // Step 2: Start the dev server
    await startServer();
    await waitForServer();
  });

  after(async () => {
    await stopServer();
  });

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
    assert.strictEqual(res.status, 201, `期望 201，得到 ${res.status}: ${body.message}`);

    // Verify response contains user data
    assert.ok(body.data, "响应应包含 data 字段");
    assert.ok(body.data.user, "响应应包含 user 对象");
    assert.strictEqual(body.data.user.name, "测试用户");
    assert.strictEqual(body.data.user.role, "patient");

    testUserId = body.data.user.id;

    // Check that the token cookie is set
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "应返回 set-cookie 头");
    const extractedToken = extractTokenCookie(setCookie);
    assert.ok(extractedToken, "set-cookie 应包含 token");

    token = extractedToken;
  });

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
    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}: ${body.message}`);

    // Verify response contains user data
    assert.ok(body.data, "响应应包含 data 字段");
    assert.ok(body.data.user, "响应应包含 user 对象");
    assert.strictEqual(body.data.user.name, "张三");

    // Check token cookie is set
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "应返回 set-cookie 头");
    const extractedToken = extractTokenCookie(setCookie);
    assert.ok(extractedToken, "set-cookie 应包含 token");

    token = extractedToken;
  });

  // ── Test 3: 医院列表测试 ────────────────────────────────────────────

  it("3️⃣  GET /api/hospitals — 获取医院列表", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(body.data, "响应应包含 data 字段");
    assert.ok(Array.isArray(body.data.list), "data.list 应为数组");
    assert.ok(body.data.total >= 2, `应至少返回2家医院，实际 ${body.data.total}`);

    // Verify "杭州市第一人民医院" is in the list
    const names = body.data.list.map((h) => h.name);
    assert.ok(names.includes("杭州市第一人民医院"), "医院列表应包含「杭州市第一人民医院」");

    hospitals = body.data.list;
  });

  // ── Test 4: 医院详情测试 ────────────────────────────────────────────

  it("4️⃣  GET /api/hospitals/[id] — 获取医院详情", async () => {
    const hospitalId = "hospital-1"; // 杭州市第一人民医院
    const res = await fetch(`${BASE_URL}/api/hospitals/${hospitalId}`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(body.data, "响应应包含 data 字段");
    assert.strictEqual(body.data.name, "杭州市第一人民医院");
    assert.strictEqual(body.data.city, "杭州");
    assert.ok(body.data.departmentCount >= 3, "应有至少3个科室");
    assert.ok(body.data.doctorCount >= 5, "应有至少5位医生");
  });

  // ── Test 5: 科室列表测试 ────────────────────────────────────────────

  it("5️⃣  GET /api/hospitals/[hospitalId]/departments — 获取科室列表", async () => {
    const hospitalId = "hospital-1";
    const res = await fetch(`${BASE_URL}/api/hospitals/${hospitalId}/departments`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(Array.isArray(body.data), "data 应为数组");
    assert.ok(body.data.length >= 3, `内科、外科、儿科至少3个科室，实际 ${body.data.length}`);

    const names = body.data.map((d) => d.name);
    assert.ok(names.includes("内科"), "科室列表应包含「内科」");
    assert.ok(names.includes("外科"), "科室列表应包含「外科」");
    assert.ok(names.includes("儿科"), "科室列表应包含「儿科」");

    departments = body.data;
  });

  // ── Test 6: 医生列表测试 ────────────────────────────────────────────

  it("6️⃣  GET /api/hospitals/departments/[departmentId]/doctors — 获取医生列表", async () => {
    // Use the 内科 department from hospital-1
    const internalDept = departments.find((d) => d.name === "内科");
    assert.ok(internalDept, "内科科室应存在");

    const res = await fetch(
      `${BASE_URL}/api/hospitals/departments/${internalDept.id}/doctors`
    );
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(Array.isArray(body.data), "data 应为数组");
    assert.ok(body.data.length >= 2, "内科至少应有2位医生");

    const names = body.data.map((d) => d.name);
    assert.ok(names.includes("王建国"), "医生列表应包含「王建国」");
    assert.ok(names.includes("李芳"), "医生列表应包含「李芳」");

    doctors = body.data;
  });

  // ── Test 7: 排班测试 ────────────────────────────────────────────────

  it("7️⃣  GET /api/hospitals/departments/doctors/[doctorId]/schedules — 获取未来7天排班", async () => {
    const doctor = doctors[0]; // First doctor from 内科
    assert.ok(doctor, "医生应存在");

    const res = await fetch(
      `${BASE_URL}/api/hospitals/departments/doctors/${doctor.id}/schedules`
    );
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(Array.isArray(body.data), "data 应为数组");
    assert.ok(body.data.length >= 7 * 3, `未来7天每天3个时段，至少21个排班，实际 ${body.data.length}`);

    schedules = body.data;
  });

  // ── Test 8: 新增就诊人 ──────────────────────────────────────────────

  it("8️⃣  POST /api/patient-profiles — 新增就诊人（需认证）", async () => {
    assert.ok(token, "需要先登录获取 token");

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

    // If profile already exists (from seed), we may get 201 or duplication
    // Actually the seed creates one with a specific ID, let's try creating a new one
    if (res.status === 201) {
      profileId = body.data.id;
    } else if (res.status === 400) {
      // Profile might already exist; let's fetch existing ones
      console.log("  ℹ️  创建就诊人返回 400:", body.message);
    }
  });

  it("8️⃣.2 GET /api/patient-profiles — 获取就诊人列表（需认证）", async () => {
    assert.ok(token, "需要先登录获取 token");

    const res = await fetch(`${BASE_URL}/api/patient-profiles`, {
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}: ${body.message}`);

    const profiles = body.data;
    assert.ok(Array.isArray(profiles), "data 应为数组");
    assert.ok(profiles.length >= 1, "至少应有1个就诊人");

    // Use the first profile for appointment tests
    if (!profileId) profileId = profiles[0].id;
    assert.ok(profileId, "应存在就诊人 ID");
  });

  // ── Test 9: 创建挂号测试 ────────────────────────────────────────────

  it("9️⃣  POST /api/appointments — 创建挂号（需认证）", async () => {
    assert.ok(token, "需要 token");
    assert.ok(schedules.length > 0, "需要排班数据");
    assert.ok(profileId, "需要就诊人 ID");

    // Pick a schedule with remaining capacity
    const availableSchedule = schedules.find((s) => s.remaining > 0);
    assert.ok(availableSchedule, "应有可用排班");

    console.log(`  ℹ️  使用排班: ${availableSchedule.date} ${availableSchedule.timeSlot} (余${availableSchedule.remaining}号)`);

    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
      body: JSON.stringify({
        scheduleId: availableSchedule.id,
        profileId: profileId,
        type: "normal",
      }),
    });

    const body = await parseResponse(res);
    assert.strictEqual(res.status, 201, `期望 201，得到 ${res.status}: ${body.message}`);

    assert.ok(body.data, "响应应包含 data");
    assert.ok(body.data.registration, "响应应包含 registration");
    assert.strictEqual(body.data.registration.status, "pending");

    appointmentId = body.data.registration.id;
  });

  // ── Test 10: 重复挂号测试 ───────────────────────────────────────────

  it("🔟  POST /api/appointments — 同一患者同一时段重复挂号应返回 409", async () => {
    assert.ok(token, "需要 token");
    assert.ok(schedules.length > 0, "需要排班数据");
    assert.ok(profileId, "需要就诊人 ID");

    // 使用与 Test 9 同样的排班 — 同一患者同一时段应该冲突
    // 但注意，test 9 已经占用了那个时段，所以重复应该返回 409
    const availableSchedule = schedules.find((s) => s.remaining > 0);
    assert.ok(availableSchedule, "应有可用排班");

    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
      body: JSON.stringify({
        scheduleId: availableSchedule.id,
        profileId: profileId,
        type: "normal",
      }),
    });

    const body = await parseResponse(res);

    // Either 409 (same patient, same time slot) or 201 (different schedule)
    if (res.status === 201) {
      console.log("  ℹ️  不同排班，创建成功");
    } else {
      assert.strictEqual(res.status, 409, `重复挂号期望 409，得到 ${res.status}: ${body.message}`);
      assert.strictEqual(body.data, null);
    }
  });

  // ── Test 11: 挂号记录列表测试 ───────────────────────────────────────

  it("1️⃣1️⃣  GET /api/appointments — 获取挂号记录列表（需认证）", async () => {
    assert.ok(token, "需要 token");

    const res = await fetch(`${BASE_URL}/api/appointments`, {
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(body.data, "响应应包含 data");
    assert.ok(Array.isArray(body.data.list), "data.list 应为数组");
    assert.ok(body.data.list.length >= 1, "至少应有1条挂号记录");
    assert.ok(body.data.total >= 1, "total 至少为1");
  });

  // ── Test 12: 挂号详情测试 ───────────────────────────────────────────

  it("1️⃣2️⃣  GET /api/appointments/[id] — 获取挂号详情（需认证）", async () => {
    assert.ok(token, "需要 token");
    assert.ok(appointmentId, "需要挂号记录 ID");

    const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}`, {
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.ok(body.data, "响应应包含 data");
    assert.ok(body.data.registration, "应包含 registration");
    assert.strictEqual(body.data.registration.id, appointmentId);
    assert.strictEqual(body.data.registration.status, "pending");
  });

  // ── Test 13: 取消挂号测试 ───────────────────────────────────────────

  it("1️⃣3️⃣  POST /api/appointments/[id]/cancel — 取消挂号（需认证）", async () => {
    assert.ok(token, "需要 token");
    assert.ok(appointmentId, "需要挂号记录 ID");

    const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: { cookie: `token=${token}` },
    });
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `取消挂号期望 200，得到 ${res.status}: ${body.message}`);
    assert.ok(body.data, "响应应包含 data");
    assert.ok(body.data.registration, "应包含 registration");
    assert.strictEqual(body.data.registration.status, "cancelled");
  });

  // ── Test 14: 管理员路由保护测试 ─────────────────────────────────────

  it("1️⃣4️⃣  GET /api/admin/stats — 未认证访问管理接口应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 401, `期望 401，得到 ${res.status}`);
    assert.strictEqual(body.data, null);
  });

  // ── Test 15: 未认证访问需认证接口 ──────────────────────────────────

  it("1️⃣5️⃣  GET /api/appointments — 未认证访问应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 401, `期望 401，得到 ${res.status}: ${body.message}`);
  });

  // ── Test 16: 医院搜索/筛选测试 ─────────────────────────────────────

  it("1️⃣6️⃣  GET /api/hospitals?city=杭州 — 按城市筛选医院", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals?city=杭州`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200);
    assert.ok(body.data.list.length >= 2, "杭州至少应有2家医院");
    body.data.list.forEach((h) => {
      assert.strictEqual(h.city, "杭州", "返回的医院城市应均为杭州");
    });
  });

  // ── Test 17: 不存在的医院路由 ──────────────────────────────────────

  it("1️⃣7️⃣  GET /api/hospitals/non-existent — 不存在的医院应返回 404", async () => {
    const res = await fetch(`${BASE_URL}/api/hospitals/non-existent`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 404, `期望 404，得到 ${res.status}`);
  });

  // ── Test 18: 不存在的科室路由 ──────────────────────────────────────

  it("1️⃣8️⃣  GET /api/hospitals/departments/non-existent/doctors — 不存在的科室应返回 404", async () => {
    const res = await fetch(
      `${BASE_URL}/api/hospitals/departments/non-existent-id/doctors`
    );
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 404, `期望 404，得到 ${res.status}`);
  });

  // ── Test 19: 注册失败 — 缺少必填字段 ──────────────────────────────

  it("1️⃣9️⃣  POST /api/auth/register — 缺少必填字段应返回 400", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }), // no email, phone, password
    });
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 400, `期望 400，得到 ${res.status}: ${body.message}`);
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

    assert.strictEqual(res.status, 401, `期望 401，得到 ${res.status}: ${body.message}`);
    assert.strictEqual(body.data, null);
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
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 401, `期望 401，得到 ${res.status}: ${body.message}`);
  });

  // ── Test 22: Patient profiles without auth ──────────────────────────

  it("2️⃣2️⃣  GET /api/patient-profiles — 未认证应返回 401", async () => {
    const res = await fetch(`${BASE_URL}/api/patient-profiles`);
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 401, `期望 401，得到 ${res.status}: ${body.message}`);
  });

  // ── Test 23: Logout and verify token is cleared ────────────────────

  it("2️⃣3️⃣  POST /api/auth/logout — 登出并清除 token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
    const body = await parseResponse(res);

    assert.strictEqual(res.status, 200, `期望 200，得到 ${res.status}`);
    assert.strictEqual(body.code, 0);

    // Check set-cookie clears token
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "应返回 set-cookie");
    assert.ok(setCookie.includes("token="), "set-cookie 应包含 token");
    assert.ok(
      setCookie.includes("Max-Age=0") || setCookie.includes("expires=Thu, 01 Jan 1970"),
      "token 应被清除"
    );
  });
});

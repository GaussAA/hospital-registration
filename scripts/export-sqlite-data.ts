/**
 * 导出 SQLite 全部存量数据为 JSON
 * 运行方式: bun run scripts/export-sqlite-data.ts
 *
 * 在切换 PostgreSQL 前执行，确保数据不丢失
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("📤 Exporting SQLite data...");

  const data: Record<string, unknown[]> = {};

  // 按依赖顺序导出（先导无外键依赖的表）
  data.users = await prisma.user.findMany();
  console.log(`  ✅ User: ${data.users.length} records`);

  data.hospitals = await prisma.hospital.findMany();
  console.log(`  ✅ Hospital: ${data.hospitals.length} records`);

  data.patientProfiles = await prisma.patientProfile.findMany();
  console.log(`  ✅ PatientProfile: ${data.patientProfiles.length} records`);

  data.departments = await prisma.department.findMany();
  console.log(`  ✅ Department: ${data.departments.length} records`);

  data.doctors = await prisma.doctor.findMany();
  console.log(`  ✅ Doctor: ${data.doctors.length} records`);

  data.schedules = await prisma.schedule.findMany();
  console.log(`  ✅ Schedule: ${data.schedules.length} records`);

  data.registrations = await prisma.registration.findMany();
  console.log(`  ✅ Registration: ${data.registrations.length} records`);

  data.conversations = await prisma.conversation.findMany();
  console.log(`  ✅ Conversation: ${data.conversations.length} records`);

  data.messages = await prisma.message.findMany();
  console.log(`  ✅ Message: ${data.messages.length} records`);

  data.toolCalls = await prisma.toolCall.findMany();
  console.log(`  ✅ ToolCall: ${data.toolCalls.length} records`);

  data.sessionStates = await prisma.sessionState.findMany();
  console.log(`  ✅ SessionState: ${data.sessionStates.length} records`);

  data.messageFeedbacks = await prisma.messageFeedback.findMany();
  console.log(`  ✅ MessageFeedback: ${data.messageFeedbacks.length} records`);

  data.userMemories = await prisma.userMemory.findMany();
  console.log(`  ✅ UserMemory: ${data.userMemories.length} records`);

  // 写入 JSON 文件
  const exportDir = join(__dirname, "..", "prisma", "data-export");
  mkdirSync(exportDir, { recursive: true });
  const outputPath = join(exportDir, "sqlite-backup.json");
  writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`\n📦 Data exported to: ${outputPath}`);
  console.log(`📊 Total records: ${Object.values(data).reduce((sum, arr) => sum + arr.length, 0)}`);
}

main()
  .catch((e) => {
    console.error("❌ Export failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({
  adapter,
});

function generateDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const TIME_SLOTS = ["am", "pm", "evening"] as const;

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Admin User ─────────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hospital.com" },
    update: {},
    create: {
      name: "系统管理员",
      email: "admin@hospital.com",
      phone: "13800000000",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
  });
  console.log(`  ✅ Admin user: ${admin.email}`);

  // ── 2. Demo Patient ───────────────────────────────────────────────────
  const patientPasswordHash = await bcrypt.hash("patient123", 10);
  const patient = await prisma.user.upsert({
    where: { email: "patient@demo.com" },
    update: {},
    create: {
      name: "张三",
      email: "patient@demo.com",
      phone: "13900000001",
      passwordHash: patientPasswordHash,
      role: "patient",
    },
  });
  console.log(`  ✅ Patient user: ${patient.email}`);

  // Profile for the demo patient
  const profile = await prisma.patientProfile.upsert({
    where: { id: "demo-profile-1" },
    update: {},
    create: {
      id: "demo-profile-1",
      userId: patient.id,
      name: "张三",
      idCard: "110101199001011234",
      phone: "13900000001",
      gender: "male",
    },
  });
  console.log(`  ✅ Patient profile: ${profile.name}`);

  // ── 3. Hospitals ──────────────────────────────────────────────────────
  const hospital1 = await prisma.hospital.upsert({
    where: { id: "hospital-1" },
    update: {},
    create: {
      id: "hospital-1",
      name: "杭州市第一人民医院",
      address: "浙江省杭州市上城区浣纱路261号",
      city: "杭州",
      level: "三级甲等",
      phone: "0571-56006600",
      description:
        "杭州市第一人民医院是集医疗、教学、科研于一体的三级甲等综合性医院，拥有雄厚的医疗技术力量和先进的医疗设备。",
      imageUrl: "/images/hospital-1.jpg",
    },
  });

  const hospital2 = await prisma.hospital.upsert({
    where: { id: "hospital-2" },
    update: {},
    create: {
      id: "hospital-2",
      name: "杭州仁和诊所",
      address: "浙江省杭州市西湖区文三路100号",
      city: "杭州",
      level: "二级甲等",
      phone: "0571-88001000",
      description:
        "杭州仁和诊所是一家综合性医疗机构，提供内科、外科、儿科等常见疾病的诊疗服务。",
      imageUrl: "/images/hospital-2.jpg",
    },
  });
  console.log(`  ✅ Hospitals created: ${hospital1.name}, ${hospital2.name}`);

  // ── 4. Departments ────────────────────────────────────────────────────
  const dept1_1 = await prisma.department.upsert({
    where: { name_hospitalId: { name: "内科", hospitalId: hospital1.id } },
    update: {},
    create: {
      id: "dept-1-1",
      name: "内科",
      description: "诊治心血管、呼吸、消化等系统疾病的临床科室。",
      hospitalId: hospital1.id,
    },
  });
  const dept1_2 = await prisma.department.upsert({
    where: { name_hospitalId: { name: "外科", hospitalId: hospital1.id } },
    update: {},
    create: {
      id: "dept-1-2",
      name: "外科",
      description: "处理各类外科手术及创伤救治的临床科室。",
      hospitalId: hospital1.id,
    },
  });
  const dept1_3 = await prisma.department.upsert({
    where: { name_hospitalId: { name: "儿科", hospitalId: hospital1.id } },
    update: {},
    create: {
      id: "dept-1-3",
      name: "儿科",
      description: "提供0-14岁儿童疾病诊疗和健康管理服务。",
      hospitalId: hospital1.id,
    },
  });

  const dept2_1 = await prisma.department.upsert({
    where: { name_hospitalId: { name: "内科", hospitalId: hospital2.id } },
    update: {},
    create: {
      id: "dept-2-1",
      name: "内科",
      description: "常见内科疾病的诊疗。",
      hospitalId: hospital2.id,
    },
  });
  const dept2_2 = await prisma.department.upsert({
    where: { name_hospitalId: { name: "外科", hospitalId: hospital2.id } },
    update: {},
    create: {
      id: "dept-2-2",
      name: "外科",
      description: "常见外科手术和创伤处理。",
      hospitalId: hospital2.id,
    },
  });
  const dept2_3 = await prisma.department.upsert({
    where: { name_hospitalId: { name: "儿科", hospitalId: hospital2.id } },
    update: {},
    create: {
      id: "dept-2-3",
      name: "儿科",
      description: "儿童常见病诊疗。",
      hospitalId: hospital2.id,
    },
  });
  console.log("  ✅ Departments created (6 total)");

  // ── 5. Doctors ────────────────────────────────────────────────────────
  const doctors = [
    // Hospital 1
    {
      id: "doctor-1-1",
      name: "王建国",
      title: "主任医师",
      specialty: "心血管内科",
      introduction:
        "从事心血管内科临床工作30余年，擅长冠心病、高血压等疾病的诊治。",
      departmentId: dept1_1.id,
      hospitalId: hospital1.id,
    },
    {
      id: "doctor-1-2",
      name: "李芳",
      title: "副主任医师",
      specialty: "呼吸内科",
      introduction: "擅长慢性阻塞性肺疾病、哮喘等呼吸系统疾病的诊治。",
      departmentId: dept1_1.id,
      hospitalId: hospital1.id,
    },
    {
      id: "doctor-1-3",
      name: "张伟",
      title: "主任医师",
      specialty: "普通外科",
      introduction: "擅长肝胆外科、胃肠道肿瘤手术治疗。",
      departmentId: dept1_2.id,
      hospitalId: hospital1.id,
    },
    {
      id: "doctor-1-4",
      name: "陈小明",
      title: "副主任医师",
      specialty: "骨科",
      introduction: "擅长骨折创伤修复、关节置换等手术。",
      departmentId: dept1_2.id,
      hospitalId: hospital1.id,
    },
    {
      id: "doctor-1-5",
      name: "刘婷",
      title: "主任医师",
      specialty: "小儿内科",
      introduction: "擅长儿童呼吸系统疾病、消化系统疾病诊治。",
      departmentId: dept1_3.id,
      hospitalId: hospital1.id,
    },
    // Hospital 2
    {
      id: "doctor-2-1",
      name: "赵强",
      title: "主治医师",
      specialty: "内科",
      introduction: "擅长内科常见疾病的诊断与治疗。",
      departmentId: dept2_1.id,
      hospitalId: hospital2.id,
    },
    {
      id: "doctor-2-2",
      name: "孙丽",
      title: "主治医师",
      specialty: "外科",
      introduction: "擅长普外科常见手术和创伤处理。",
      departmentId: dept2_2.id,
      hospitalId: hospital2.id,
    },
    {
      id: "doctor-2-3",
      name: "周丽华",
      title: "副主任医师",
      specialty: "儿科",
      introduction: "擅长儿童常见病、多发病的诊治。",
      departmentId: dept2_3.id,
      hospitalId: hospital2.id,
    },
  ];

  for (const d of doctors) {
    await prisma.doctor.upsert({ where: { id: d.id }, update: {}, create: d });
  }
  console.log(`  ✅ Doctors created (${doctors.length} total)`);

  // ── 6. Schedules (next 7 days for each doctor) ────────────────────────
  const allDoctors = await prisma.doctor.findMany();
  let scheduleCount = 0;

  for (const doctor of allDoctors) {
    for (let day = 0; day < 7; day++) {
      const date = generateDateOffset(day);
      for (const slot of TIME_SLOTS) {
        const quota = slot === "am" ? 30 : slot === "pm" ? 25 : 20;
        try {
          await prisma.schedule.create({
            data: {
              doctorId: doctor.id,
              date,
              timeSlot: slot,
              quota,
              bookedCount: 0,
              type: "normal",
            },
          });
          scheduleCount++;
        } catch {
          // Skip duplicate schedules
        }
      }
    }
  }
  console.log(`  ✅ Schedules created (${scheduleCount} total)`);

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

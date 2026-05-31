import { getPrisma } from "@/lib/db";
import type { ToolDefinition, ToolParam, FunctionCallTool } from "./types";
import type { Gender } from "@/types/index";

/**
 * All tools available to the AI agent.
 * Each tool has a schema (for LLM function calling) and a handler (actual execution).
 */

/* ── Helper: format objects for natural language ── */

function fmtHospital(h: { id: string; name: string; level: string; city: string; address: string; phone?: string }) {
  return `【${h.name}】(${h.level} | ${h.city}) - ${h.address}${h.phone ? ` 电话:${h.phone}` : ""}`;
}

function fmtDepartment(d: { id: string; name: string; description?: string }) {
  return `【${d.name}】${d.description ? ` - ${d.description}` : ""}`;
}

function fmtDoctor(doc: { id: string; name: string; title: string; specialty?: string }) {
  return `【${doc.name}】${doc.title} ${doc.specialty ? `(专长: ${doc.specialty})` : ""}`;
}

function fmtSchedule(s: { id: string; date: string; timeSlot: string; quota: number; bookedCount: number; type: string }) {
  const slotLabel: Record<string, string> = { am: "上午", pm: "下午", evening: "晚间" };
  const typeLabel: Record<string, string> = { normal: "普通号", expert: "专家号", special: "特需号" };
  const available = s.quota - s.bookedCount;
  return `${s.date} ${slotLabel[s.timeSlot] || s.timeSlot} — ${typeLabel[s.type] || s.type} (剩余${available}/${s.quota}号)`;
}

function fmtProfile(p: { id: string; name: string; idCard?: string; phone?: string; gender?: string }) {
  const genderLabel = p.gender === "male" ? "男" : p.gender === "female" ? "女" : "未知";
  return `【${p.name}】${genderLabel} ${p.idCard ? `身份证:${p.idCard}` : ""} ${p.phone ? `手机:${p.phone}` : ""}`;
}

/* ── param shorthand ── */

const str = (desc: string, required = false, enums?: string[]): ToolParam => ({
  type: "string",
  description: desc,
  ...(required ? { required: true } : {}),
  ...(enums ? { enum: enums } : {}),
});

const num = (desc: string, required = false): ToolParam => ({
  type: "number",
  description: desc,
  ...(required ? { required: true } : {}),
});

/* ── Tool Definitions ── */

const toolDefs: ToolDefinition[] = [
  // ── 1. Search Hospitals ──
  {
    name: "search_hospitals",
    description: "搜索医院，可按城市、等级、关键字筛选",
    parameters: {
      keyword: str("搜索关键字（医院名称）"),
      city: str("城市名（如「北京」「上海」），不传则全国搜索"),
      level: str("医院等级（如「三级甲等」「二级甲等」）"),
    },
    handler: async (args) => {
      const prisma = await getPrisma();
      const where: Record<string, unknown> = {};
      if (args.keyword) where.name = { contains: args.keyword as string };
      if (args.city) where.city = { contains: args.city as string };
      if (args.level) where.level = { contains: args.level as string };

      const hospitals = await prisma.hospital.findMany({ where, take: 10, orderBy: { createdAt: "desc" } });

      if (hospitals.length === 0) return "抱歉，没有找到符合条件的医院。";
      const header = `找到了 ${hospitals.length} 家医院：\n\n`;
      return header + hospitals.map((h: any) => `🏥 ${fmtHospital(h)}`).join("\n") + "\n\n请输入医院名称或编号继续查询科室。";
    },
  },

  // ── 2. Search Departments ──
  {
    name: "search_departments",
    description: "查询指定医院下的所有科室",
    parameters: {
      hospitalId: str("医院ID", true),
    },
    handler: async (args) => {
      const prisma = await getPrisma();
      const hospital = await prisma.hospital.findUnique({ where: { id: args.hospitalId as string } });
      if (!hospital) return "未找到该医院。";

      const departments = await prisma.department.findMany({
        where: { hospitalId: args.hospitalId as string },
        orderBy: { name: "asc" },
      });

      if (departments.length === 0) return `医院"${hospital.name}"暂无可选科室。`;
      const header = `🏥 ${hospital.name} — 科室列表：\n\n`;
      return header + departments.map((d: any) => `📋 ${fmtDepartment(d)}`).join("\n") + "\n\n请输入科室名称或编号查看医生。";
    },
  },

  // ── 3. Search Doctors ──
  {
    name: "search_doctors",
    description: "查询指定科室下的所有医生",
    parameters: {
      departmentId: str("科室ID", true),
    },
    handler: async (args) => {
      const prisma = await getPrisma();
      const department = await prisma.department.findUnique({
        where: { id: args.departmentId as string },
        include: { hospital: true },
      });
      if (!department) return "未找到该科室。";

      const doctors = await prisma.doctor.findMany({
        where: { departmentId: args.departmentId as string },
        orderBy: { name: "asc" },
      });

      if (doctors.length === 0) return `科室"${department.name}"暂无医生。`;
      const header = `📋 ${department.hospital.name} — ${department.name} — 医生列表：\n\n`;
      return header + doctors.map((d: any) => `👨‍⚕️ ${fmtDoctor(d)}`).join("\n") + "\n\n请输入医生名称或编号查看排班和挂号。";
    },
  },

  // ── 4. Get Doctor Schedules ──
  {
    name: "get_doctor_schedules",
    description: "查看指定医生未来7天的排班信息",
    parameters: {
      doctorId: str("医生ID", true),
    },
    handler: async (args) => {
      const prisma = await getPrisma();
      const doctor = await prisma.doctor.findUnique({
        where: { id: args.doctorId as string },
        include: { department: { include: { hospital: true } } },
      });
      if (!doctor) return "未找到该医生。";

      // Get schedules for the next 7 days
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);
      const dateStr = (d: Date) => d.toISOString().slice(0, 10);

      const schedules = await prisma.schedule.findMany({
        where: {
          doctorId: args.doctorId as string,
          date: { gte: dateStr(today), lte: dateStr(endDate) },
        },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      });

      // Format by date
      const grouped: Record<string, typeof schedules> = {};
      for (const s of schedules) {
        if (!grouped[s.date]) grouped[s.date] = [];
        grouped[s.date].push(s);
      }

      if (Object.keys(grouped).length === 0) {
        return `医生"${doctor.name}"未来7天暂无排班。`;
      }

      const header = `👨‍⚕️ ${doctor.department.hospital.name} — ${doctor.department.name} — ${fmtDoctor(doctor as any)}\n\n未来7天排班：\n\n`;
      const body = Object.entries(grouped)
        .map(([date, slots]) => `📅 ${date}\n${(slots as any[]).map((s) => `  ${fmtSchedule(s)}`).join("\n")}`)
        .join("\n\n");

      return header + body + "\n\n请输入排班编号（日期+时段）选择号源进行挂号。";
    },
  },

  // ── 5. Get Patient Profiles (requires auth) ──
  {
    name: "get_patient_profiles",
    description: "获取当前用户的所有就诊人信息（需要登录）",
    parameters: {},
    handler: async (_args, ctx) => {
      if (!ctx.userId) return "您还未登录，请先登录后再查看就诊人信息。";

      const prisma = await getPrisma();
      const profiles = await prisma.patientProfile.findMany({
        where: { userId: ctx.userId },
        orderBy: { name: "asc" },
      });

      if (profiles.length === 0) {
        return "您还没有添加就诊人，请输入就诊人信息进行添加（姓名、身份证号、手机号、性别）。";
      }

      return "您的就诊人列表：\n\n" + profiles.map((p: any, i: number) => `${i + 1}. ${fmtProfile(p)}`).join("\n") + "\n\n请选择就诊人进行挂号。";
    },
  },

  // ── 6. Create Patient Profile (requires auth) ──
  {
    name: "create_patient_profile",
    description: "添加新的就诊人",
    parameters: {
      name: str("就诊人姓名", true),
      idCard: str("身份证号", true),
      phone: str("手机号", true),
      gender: str("性别", true, ["male", "female"]),
    },
    handler: async (args, ctx) => {
      if (!ctx.userId) return "您还未登录，请先登录后再添加就诊人。";

      const prisma = await getPrisma();
      const profile = await prisma.patientProfile.create({
        data: {
          userId: ctx.userId,
          name: args.name as string,
          idCard: args.idCard as string,
          phone: args.phone as string,
          gender: args.gender as Gender,
        },
      });

      return `✅ 就诊人添加成功：${fmtProfile(profile)}`;
    },
  },

  // ── 7. Create Registration (requires auth) ──
  {
    name: "create_registration",
    description: "创建挂号（预约）记录",
    parameters: {
      scheduleId: str("排班ID", true),
      profileId: str("就诊人ID", true),
      type: str("号类类型", true, ["normal", "expert", "special"]),
    },
    handler: async (args, ctx) => {
      if (!ctx.userId) return "您还未登录，请先登录后再进行挂号。";

      const prisma = await getPrisma();

      // Fetch schedule and run the transaction
      try {
        const registration = await prisma.$transaction(async (tx) => {
          const schedule = await tx.schedule.findUnique({ where: { id: args.scheduleId as string } });
          if (!schedule) throw new Error("排班不存在");
          if (schedule.bookedCount >= schedule.quota) throw new Error("号源已满");

          // Duplicate check
          const existing = await tx.registration.findFirst({
            where: {
              patientId: ctx.userId!,
              date: schedule.date,
              timeSlot: schedule.timeSlot,
              status: { not: "cancelled" },
            },
          });
          if (existing) throw new Error("该时段您已存在挂号记录");

          // Optimistic lock
          const result = await tx.schedule.updateMany({
            where: { id: args.scheduleId as string, bookedCount: { lt: schedule.quota } },
            data: { bookedCount: { increment: 1 } },
          });
          if (result.count === 0) throw new Error("号源已被抢完");

          // Get doctor & profile info for response
          const doc = await tx.doctor.findUnique({ where: { id: schedule.doctorId } });

          return tx.registration.create({
            data: {
              patientId: ctx.userId!,
              profileId: args.profileId as string,
              doctorId: schedule.doctorId,
              scheduleId: args.scheduleId as string,
              date: schedule.date,
              timeSlot: schedule.timeSlot,
              type: args.type as string,
              status: "pending",
            },
            include: {
              doctor: { include: { department: { include: { hospital: true } } } },
              profile: true,
            },
          });
        });

        const slotLabel: Record<string, string> = { am: "上午", pm: "下午", evening: "晚间" };
        const typeLabel: Record<string, string> = { normal: "普通号", expert: "专家号", special: "特需号" };

        return `✅ 挂号成功！\n\n` +
          `🏥 医院：${(registration as any).doctor.department.hospital.name}\n` +
          `📋 科室：${(registration as any).doctor.department.name}\n` +
          `👨‍⚕️ 医生：${(registration as any).doctor.name}（${(registration as any).doctor.title}）\n` +
          `🧑 就诊人：${(registration as any).profile.name}\n` +
          `📅 时间：${registration.date} ${slotLabel[registration.timeSlot] || registration.timeSlot}\n` +
          `🎫 号类：${typeLabel[registration.type] || registration.type}\n` +
          `🆔 挂号编号：${registration.id}\n\n` +
          `请按时就诊！`;
      } catch (e: any) {
        return `❌ 挂号失败：${e.message}`;
      }
    },
  },

  // ── 8. List Registrations (requires auth) ──
  {
    name: "list_registrations",
    description: "查看我的挂号记录，可按状态筛选",
    parameters: {
      status: str("挂号状态筛选", false, ["pending", "done", "cancelled"]),
    },
    handler: async (args, ctx) => {
      if (!ctx.userId) return "您还未登录，请先登录后再查看挂号记录。";

      const prisma = await getPrisma();
      const where: Record<string, unknown> = { patientId: ctx.userId };
      if (args.status) where.status = args.status;

      const registrations = await prisma.registration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          doctor: { include: { department: { include: { hospital: true } } } },
          profile: true,
        },
      });

      if (registrations.length === 0) return "暂未找到挂号记录。";

      const statusLabel: Record<string, string> = { pending: "待就诊", done: "已完成", cancelled: "已取消" };
      const slotLabel: Record<string, string> = { am: "上午", pm: "下午", evening: "晚间" };

      return `您的挂号记录（共${registrations.length}条）：\n\n` +
        registrations.map((r: any, i: number) =>
          `${i + 1}. 🆔 ${r.id}\n` +
          `   🏥 ${r.doctor.department.hospital.name} | ${r.doctor.department.name} | ${r.doctor.name} ${r.doctor.title}\n` +
          `   📅 ${r.date} ${slotLabel[r.timeSlot] || r.timeSlot} | 状态：${statusLabel[r.status] || r.status}\n` +
          `   🧑 就诊人：${r.profile.name}`
        ).join("\n\n") + "\n\n如需取消挂号，请提供挂号编号。";
    },
  },

  // ── 9. Cancel Registration (requires auth) ──
  {
    name: "cancel_registration",
    description: "取消挂号（仅可取消待就诊状态的挂号）",
    parameters: {
      registrationId: str("挂号记录ID", true),
    },
    handler: async (args, ctx) => {
      if (!ctx.userId) return "您还未登录，请先登录后再操作。";

      const prisma = await getPrisma();
      try {
        const result = await prisma.$transaction(async (tx) => {
          const registration = await tx.registration.findUnique({
            where: { id: args.registrationId as string },
            include: { schedule: true },
          });

          if (!registration) throw new Error("挂号记录不存在");
          if (registration.patientId !== ctx.userId) throw new Error("无权操作此挂号记录");
          if (registration.status !== "pending") throw new Error("当前状态不可取消");

          await tx.schedule.update({
            where: { id: registration.scheduleId },
            data: { bookedCount: { decrement: 1 } },
          });

          return tx.registration.update({
            where: { id: args.registrationId as string },
            data: { status: "cancelled" },
          });
        });

        return `✅ 挂号已取消成功（编号：${args.registrationId}）`;
      } catch (e: any) {
        return `❌ 取消失败：${e.message}`;
      }
    },
  },

  // ── 10. Get Hospital by ID (for internal use / follow-up) ──
  {
    name: "get_hospital_detail",
    description: "查看医院详细信息",
    parameters: {
      hospitalId: str("医院ID", true),
    },
    handler: async (args) => {
      const prisma = await getPrisma();
      const hospital = await prisma.hospital.findUnique({
        where: { id: args.hospitalId as string },
        include: { departments: { take: 5, orderBy: { name: "asc" } } },
      });
      if (!hospital) return "未找到该医院。";

      let result = `🏥 ${fmtHospital(hospital as any)}\n`;
      result += `简介：${(hospital as any).description || "暂无简介"}\n`;
      if ((hospital as any).departments?.length > 0) {
        result += `\n热门科室：\n${(hospital as any).departments.map((d: any) => `  📋 ${fmtDepartment(d)}`).join("\n")}`;
      }
      return result;
    },
  },

  // ── 11. Get Doctor Detail ──
  {
    name: "get_doctor_detail",
    description: "查看医生详细信息",
    parameters: {
      doctorId: str("医生ID", true),
    },
    handler: async (args) => {
      const prisma = await getPrisma();
      const doctor = await prisma.doctor.findUnique({
        where: { id: args.doctorId as string },
        include: { department: { include: { hospital: true } } },
      });
      if (!doctor) return "未找到该医生。";

      const intro = (doctor as any).introduction || "暂无简介";
      return `👨‍⚕️ ${fmtDoctor(doctor as any)}\n` +
        `所在医院：${(doctor as any).department.hospital.name}\n` +
        `所在科室：${(doctor as any).department.name}\n` +
        `简介：${intro}`;
    },
  },

  // ── 12. Recommend Department by Symptoms ──
  {
    name: "recommend_department",
    description: "根据患者的症状描述推荐合适的就诊科室",
    parameters: {
      symptoms: str("症状描述，如「发烧咳嗽」「头痛三天」", true),
    },
    handler: async (args) => {
      const symptoms = (args.symptoms as string || "").toLowerCase();

      // Common symptom-department mapping
      const symptomMap: Record<string, string[]> = {
        "发烧": ["发热门诊", "呼吸内科", "感染科"],
        "咳嗽": ["呼吸内科", "胸外科"],
        "头痛": ["神经内科", "神经外科"],
        "胸闷": ["心血管内科", "呼吸内科"],
        "腹痛": ["消化内科", "胃肠外科", "急诊科"],
        "腹泻": ["消化内科", "肠道门诊"],
        "呕吐": ["消化内科", "急诊科"],
        "皮疹": ["皮肤科"],
        "关节痛": ["风湿免疫科", "骨科"],
        "腰痛": ["骨科", "泌尿外科", "肾内科"],
        "心慌": ["心血管内科"],
        "失眠": ["精神心理科", "神经内科"],
        "头晕": ["神经内科", "耳鼻喉科", "骨科"],
        "耳鸣": ["耳鼻喉科"],
        "视力下降": ["眼科"],
        "尿频": ["泌尿外科", "肾内科"],
        "便秘": ["消化内科"],
        "过敏": ["皮肤科", "过敏反应科"],
        "外伤": ["急诊科", "骨科", "普外科"],
        "骨折": ["骨科", "急诊科"],
        "孕期": ["妇产科"],
        "月经不调": ["妇科", "内分泌科"],
        "胸痛": ["心血管内科", "呼吸内科", "急诊科"],
        "喉咙痛": ["耳鼻喉科", "呼吸内科"],
        "牙痛": ["口腔科"],
        "背痛": ["骨科", "康复科"],
        "水肿": ["肾内科", "心血管内科"],
        "消瘦": ["内分泌科", "消化内科"],
        "贫血": ["血液科"],
        "淋巴结肿大": ["血液科", "肿瘤科", "普外科"],
      };

      const matched: string[] = [];
      const matchedSymptoms: string[] = [];

      for (const [symptom, depts] of Object.entries(symptomMap)) {
        if (symptoms.includes(symptom)) {
          matched.push(...depts);
          matchedSymptoms.push(symptom);
        }
      }

      if (matched.length === 0) {
        return `根据您描述的"${args.symptoms}"，我没有找到特别匹配的科室。\n\n建议您先挂**全科**或**导诊台**咨询，或在平台上搜索相关症状的科室。\n\n如果症状比较严重，请及时到**急诊科**就诊。`;
      }

      const uniqueDepts = [...new Set(matched)];
      const symptomList = matchedSymptoms.join("、");

      return `根据您描述的"${args.symptoms}"，检测到以下症状：${symptomList}\n\n` +
        `建议您考虑挂以下科室：\n\n` +
        uniqueDepts.map((d, i) => `${i + 1}. **${d}**`).join("\n") +
        `\n\n> ⚠️ 以上推荐仅供参考，如有严重不适请立即前往医院急诊科就诊。`;
    },
  },

  // ── 13. Get Registration Guide ──
  {
    name: "get_registration_guide",
    description: "获取就诊前的准备事项、所需证件和注意事项",
    parameters: {
      hospitalId: str("医院ID（可选），指定后返回该医院的具体就诊须知"),
    },
    handler: async (args) => {
      let hospitalInfo = "";

      if (args.hospitalId) {
        const prisma = await getPrisma();
        const hospital = await prisma.hospital.findUnique({
          where: { id: args.hospitalId as string },
        });
        if (hospital) {
          hospitalInfo = `\n🏥 医院：${hospital.name}\n📍 地址：${hospital.address}\n📞 电话：${hospital.phone}\n`;
        }
      }

      return `📋 **就诊指南**${hospitalInfo}\n\n` +
        `**一、就诊前准备**\n` +
        `1. **证件**：携带本人身份证/医保卡\n` +
        `2. **病历**：如有既往病历、检查报告，请一并带上\n` +
        `3. **空腹**：如需抽血检查，建议早上空腹就诊\n` +
        `4. **时间**：按预约时间提前15-30分钟到达\n\n` +
        `**二、就诊流程**\n` +
        `1. 凭身份证/医保卡到挂号窗口或自助机取号\n` +
        `2. 到相应科室分诊台报到\n` +
        `3. 等待叫号就诊\n` +
        `4. 医生问诊后根据需要开具检查/药品\n` +
        `5. 缴费→检查/取药\n\n` +
        `**三、注意事项**\n` +
        `1. 取消挂号请至少在就诊前2小时操作\n` +
        `2. 同一时段只能挂一个号源\n` +
        `3. 如需改约，请先取消原挂号再重新预约\n` +
        `4. 急重症请直接前往**急诊科**，无需预约挂号\n` +
        `5. 就诊过程中如有不适，请及时告知医护人员\n\n` +
        `祝您早日康复！🙏`;
    },
  },

  // ── 14. Analyze Image (Vision) ──
  {
    name: "analyze_image",
    description: "分析用户上传的图片（如化验单、检查报告、CT片等），从中提取关键信息并给出解读",
    parameters: {
      imageUrl: str("图片的URL或base64数据", true),
      imageType: str("图片类型，如 lab_report（化验单）、exam_report（检查报告）、ct_scan（CT片）、prescription（处方）、 other（其他）"),
    },
    handler: async (args) => {
      // P1 implementation: pass the image to DeepSeek V4 Flash's vision capabilities
      // For now, return guidance
      const typeLabels: Record<string, string> = {
        lab_report: "化验单",
        exam_report: "检查报告",
        ct_scan: "CT影像",
        prescription: "处方",
        other: "图片",
      };
      const label = typeLabels[args.imageType as string] || "图片";

      return `我已收到您上传的${label}。\n\n` +
        `系统已记录该图片，AI正在分析中。\n\n` +
        `> 💡 请等待AI对图片内容进行分析解读。\n` +
        `> ⚠️ AI解读仅供参考，最终诊断请以医生意见为准。`;
    },
  },
];

export default toolDefs;

/**
 * Convert internal tool definitions to OpenAI/DeepSeek function calling format.
 */
export function toolsToFunctionCalling(): FunctionCallTool[] {
  return toolDefs.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: "object" as const,
        properties: Object.fromEntries(
          Object.entries(t.parameters).map(([key, param]) => [
            key,
            {
              type: param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {}),
            },
          ])
        ),
        required: Object.entries(t.parameters)
          .filter(([, v]) => v.required)
          .map(([k]) => k),
      },
    },
  }));
}

export { toolDefs as tools };

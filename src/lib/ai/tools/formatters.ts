/**
 * Formatter helpers for converting DB objects to natural-language strings.
 */

export function fmtHospital(h: { id: string; name: string; level: string; city: string; address: string; phone?: string }): string {
  return `【${h.name}】(${h.level} | ${h.city}) - ${h.address}${h.phone ? ` 电话:${h.phone}` : ""}`;
}

export function fmtDepartment(d: { id: string; name: string; description?: string }): string {
  return `【${d.name}】${d.description ? ` - ${d.description}` : ""}`;
}

export function fmtDoctor(doc: { id: string; name: string; title: string; specialty?: string }): string {
  return `【${doc.name}】${doc.title} ${doc.specialty ? `(专长: ${doc.specialty})` : ""}`;
}

export function fmtSchedule(s: { id: string; date: string; timeSlot: string; quota: number; bookedCount: number; type: string }): string {
  const available = s.quota - s.bookedCount;
  return `${s.date} ${timeSlotLabels[s.timeSlot] || s.timeSlot} — ${typeLabels[s.type] || s.type} (剩余${available}/${s.quota}号)`;
}

export function fmtProfile(p: { id: string; name: string; idCard?: string; phone?: string; gender?: string }): string {
  const genderLabel = p.gender === "male" ? "男" : p.gender === "female" ? "女" : "未知";
  return `【${p.name}】${genderLabel} ${p.idCard ? `身份证:${p.idCard}` : ""} ${p.phone ? `手机:${p.phone}` : ""}`;
}

/* ── Label maps ── */

export const timeSlotLabels: Record<string, string> = {
  am: "上午",
  pm: "下午",
  evening: "晚间",
};

export const typeLabels: Record<string, string> = {
  normal: "普通号",
  expert: "专家号",
  special: "特需号",
};

export const statusLabels: Record<string, string> = {
  pending: "待就诊",
  done: "已完成",
  cancelled: "已取消",
};

export const imageTypeLabels: Record<string, string> = {
  lab_report: "化验单",
  exam_report: "检查报告",
  ct_scan: "CT影像",
  prescription: "处方",
  other: "图片",
};

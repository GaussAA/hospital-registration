import { describe, it, expect } from "vitest";
import {
  fmtHospital,
  fmtDepartment,
  fmtDoctor,
  fmtSchedule,
  fmtProfile,
  timeSlotLabels,
  typeLabels,
  statusLabels,
  imageTypeLabels,
} from "@/features/chat/tools/formatters";

describe("tools/formatters.ts", () => {
  // ── fmtHospital ──
  describe("fmtHospital", () => {
    it("should format a hospital with all fields", () => {
      const h = {
        id: "h-1",
        name: "市人民医院",
        level: "三级甲等",
        city: "北京",
        address: "北京路1号",
        phone: "010-12345678",
      };
      const result = fmtHospital(h);
      expect(result).toBe(
        "【市人民医院】(三级甲等 | 北京) - 北京路1号 电话:010-12345678 [ID:h-1]"
      );
    });

    it("should format a hospital without phone", () => {
      const h = {
        id: "h-2",
        name: "县医院",
        level: "二级甲等",
        city: "上海",
        address: "上海路1号",
      };
      const result = fmtHospital(h);
      expect(result).toBe("【县医院】(二级甲等 | 上海) - 上海路1号 [ID:h-2]");
    });

    it("should handle empty strings", () => {
      const h = {
        id: "h-3",
        name: "",
        level: "",
        city: "",
        address: "",
      };
      const result = fmtHospital(h);
      expect(result).toBe("【】( | ) -  [ID:h-3]");
    });
  });

  // ── fmtDepartment ──
  describe("fmtDepartment", () => {
    it("should format a department with description", () => {
      const d = { id: "d-1", name: "内科", description: "内科科室" };
      const result = fmtDepartment(d);
      expect(result).toBe("【内科】 - 内科科室 [ID:d-1]");
    });

    it("should format a department without description", () => {
      const d = { id: "d-2", name: "外科" };
      const result = fmtDepartment(d);
      expect(result).toBe("【外科】 [ID:d-2]");
    });

    it("should handle empty description string", () => {
      const d = { id: "d-3", name: "儿科", description: "" };
      const result = fmtDepartment(d);
      expect(result).toBe("【儿科】 [ID:d-3]");
    });
  });

  // ── fmtDoctor ──
  describe("fmtDoctor", () => {
    it("should format a doctor with specialty", () => {
      const doc = {
        id: "doc-1",
        name: "张医生",
        title: "主任医师",
        specialty: "心血管",
      };
      const result = fmtDoctor(doc);
      expect(result).toBe(
        "【张医生】主任医师 (专长: 心血管) [ID:doc-1]"
      );
    });

    it("should format a doctor without specialty", () => {
      const doc = { id: "doc-2", name: "李医生", title: "副主任医师" };
      const result = fmtDoctor(doc);
      expect(result).toBe("【李医生】副主任医师  [ID:doc-2]");
    });

    it("should handle empty specialty", () => {
      const doc = { id: "doc-3", name: "王医生", title: "主治医师", specialty: "" };
      const result = fmtDoctor(doc);
      expect(result).toBe("【王医生】主治医师  [ID:doc-3]");
    });
  });

  // ── fmtSchedule ──
  describe("fmtSchedule", () => {
    it("should format an AM normal schedule", () => {
      const s = {
        id: "s-1",
        date: "2025-01-15",
        timeSlot: "am",
        quota: 30,
        bookedCount: 10,
        type: "normal",
      };
      const result = fmtSchedule(s);
      expect(result).toBe(
        "2025-01-15 上午 — 普通号 (剩余20/30号) [ID:s-1]"
      );
    });

    it("should format a PM expert schedule with all slots booked", () => {
      const s = {
        id: "s-2",
        date: "2025-01-16",
        timeSlot: "pm",
        quota: 20,
        bookedCount: 20,
        type: "expert",
      };
      const result = fmtSchedule(s);
      expect(result).toBe(
        "2025-01-16 下午 — 专家号 (剩余0/20号) [ID:s-2]"
      );
    });

    it("should format an evening special schedule", () => {
      const s = {
        id: "s-3",
        date: "2025-01-17",
        timeSlot: "evening",
        quota: 15,
        bookedCount: 5,
        type: "special",
      };
      const result = fmtSchedule(s);
      expect(result).toBe(
        "2025-01-17 晚间 — 特需号 (剩余10/15号) [ID:s-3]"
      );
    });

    it("should handle unknown timeSlot and type", () => {
      const s = {
        id: "s-4",
        date: "2025-01-18",
        timeSlot: "unknown",
        quota: 10,
        bookedCount: 0,
        type: "unknown",
      };
      const result = fmtSchedule(s);
      expect(result).toBe(
        "2025-01-18 unknown — unknown (剩余10/10号) [ID:s-4]"
      );
    });
  });

  // ── fmtProfile ──
  describe("fmtProfile", () => {
    it("should format a male profile with all fields", () => {
      const p = {
        id: "p-1",
        name: "张三",
        idCard: "110101199001011234",
        phone: "13800138001",
        gender: "male",
      };
      const result = fmtProfile(p);
      expect(result).toBe(
        "【张三】男 身份证:110101199001011234 手机:13800138001 [ID:p-1]"
      );
    });

    it("should format a female profile without optional fields", () => {
      const p = {
        id: "p-2",
        name: "李四",
        gender: "female",
      };
      const result = fmtProfile(p);
      expect(result).toBe("【李四】女   [ID:p-2]");
    });

    it("should handle unknown gender", () => {
      const p = {
        id: "p-3",
        name: "王五",
        gender: "other",
      };
      const result = fmtProfile(p);
      expect(result).toBe("【王五】未知   [ID:p-3]");
    });
  });

  // ── Label maps ──
  describe("label maps", () => {
    it("timeSlotLabels should have correct values", () => {
      expect(timeSlotLabels).toEqual({
        am: "上午",
        pm: "下午",
        evening: "晚间",
      });
    });

    it("typeLabels should have correct values", () => {
      expect(typeLabels).toEqual({
        normal: "普通号",
        expert: "专家号",
        special: "特需号",
      });
    });

    it("statusLabels should have correct values", () => {
      expect(statusLabels).toEqual({
        pending: "待就诊",
        done: "已完成",
        cancelled: "已取消",
      });
    });

    it("imageTypeLabels should have correct values", () => {
      expect(imageTypeLabels).toEqual({
        lab_report: "化验单",
        exam_report: "检查报告",
        ct_scan: "CT影像",
        prescription: "处方",
        other: "图片",
      });
    });
  });
});

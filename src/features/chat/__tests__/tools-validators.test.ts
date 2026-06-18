import { describe, it, expect } from "vitest";
import * as validators from "@/features/chat/tools/validators";

describe("tools/validators.ts", () => {
  // ── searchHospitalsSchema ──
  describe("searchHospitalsSchema", () => {
    it("should accept empty object (all optional)", () => {
      const result = validators.searchHospitalsSchema.parse({});
      expect(result).toEqual({});
    });

    it("should accept all fields", () => {
      const result = validators.searchHospitalsSchema.parse({
        keyword: "人民医院",
        city: "北京",
        level: "三级甲等",
      });
      expect(result).toEqual({
        keyword: "人民医院",
        city: "北京",
        level: "三级甲等",
      });
    });

    it("should accept partial fields", () => {
      const result = validators.searchHospitalsSchema.parse({
        keyword: "人民医院",
      });
      expect(result).toEqual({ keyword: "人民医院" });
    });
  });

  // ── searchDepartmentsSchema ──
  describe("searchDepartmentsSchema", () => {
    it("should accept valid hospitalId", () => {
      const result = validators.searchDepartmentsSchema.parse({ hospitalId: "h-1" });
      expect(result).toEqual({ hospitalId: "h-1" });
    });

    it("should reject empty hospitalId", () => {
      expect(() => validators.searchDepartmentsSchema.parse({ hospitalId: "" })).toThrow();
    });
  });

  // ── searchDoctorsSchema ──
  describe("searchDoctorsSchema", () => {
    it("should accept valid departmentId", () => {
      const result = validators.searchDoctorsSchema.parse({ departmentId: "d-1" });
      expect(result).toEqual({ departmentId: "d-1" });
    });

    it("should reject empty departmentId", () => {
      expect(() => validators.searchDoctorsSchema.parse({ departmentId: "" })).toThrow();
    });
  });

  // ── getDoctorSchedulesSchema ──
  describe("getDoctorSchedulesSchema", () => {
    it("should accept valid doctorId", () => {
      const result = validators.getDoctorSchedulesSchema.parse({ doctorId: "doc-1" });
      expect(result).toEqual({ doctorId: "doc-1" });
    });

    it("should reject empty doctorId", () => {
      expect(() => validators.getDoctorSchedulesSchema.parse({ doctorId: "" })).toThrow();
    });
  });

  // ── getPatientProfilesSchema ──
  describe("getPatientProfilesSchema", () => {
    it("should accept empty object", () => {
      const result = validators.getPatientProfilesSchema.parse({});
      expect(result).toEqual({});
    });
  });

  // ── createPatientProfileSchema ──
  describe("createPatientProfileSchema", () => {
    it("should accept valid profile data", () => {
      const result = validators.createPatientProfileSchema.parse({
        name: "张三",
        idCard: "110101199001011234",
        phone: "13800138001",
        gender: "male",
      });
      expect(result.name).toBe("张三");
      expect(result.gender).toBe("male");
    });

    it("should accept female gender", () => {
      const result = validators.createPatientProfileSchema.parse({
        name: "李四",
        idCard: "110101199001011235",
        phone: "13800138002",
        gender: "female",
      });
      expect(result.gender).toBe("female");
    });

    it("should reject empty name", () => {
      expect(() =>
        validators.createPatientProfileSchema.parse({
          name: "",
          idCard: "110101199001011234",
          phone: "13800138001",
          gender: "male",
        })
      ).toThrow();
    });

    it("should reject invalid gender", () => {
      expect(() =>
        validators.createPatientProfileSchema.parse({
          name: "张三",
          idCard: "110101199001011234",
          phone: "13800138001",
          gender: "unknown",
        })
      ).toThrow();
    });

    it("should reject missing required fields", () => {
      expect(() =>
        validators.createPatientProfileSchema.parse({ name: "张三" })
      ).toThrow();
    });
  });

  // ── createRegistrationSchema ──
  describe("createRegistrationSchema", () => {
    it("should accept valid registration data", () => {
      const result = validators.createRegistrationSchema.parse({
        scheduleId: "s-1",
        profileId: "p-1",
        type: "normal",
      });
      expect(result.type).toBe("normal");
    });

    it("should accept expert and special types", () => {
      expect(
        validators.createRegistrationSchema.parse({ scheduleId: "s-1", profileId: "p-1", type: "expert" }).type
      ).toBe("expert");
      expect(
        validators.createRegistrationSchema.parse({ scheduleId: "s-1", profileId: "p-1", type: "special" }).type
      ).toBe("special");
    });

    it("should reject invalid type", () => {
      expect(() =>
        validators.createRegistrationSchema.parse({
          scheduleId: "s-1",
          profileId: "p-1",
          type: "invalid",
        })
      ).toThrow();
    });

    it("should reject empty IDs", () => {
      expect(() =>
        validators.createRegistrationSchema.parse({
          scheduleId: "",
          profileId: "p-1",
          type: "normal",
        })
      ).toThrow();
    });
  });

  // ── listRegistrationsSchema ──
  describe("listRegistrationsSchema", () => {
    it("should accept empty object (status optional)", () => {
      const result = validators.listRegistrationsSchema.parse({});
      expect(result).toEqual({});
    });

    it("should accept valid status values", () => {
      expect(
        validators.listRegistrationsSchema.parse({ status: "pending" }).status
      ).toBe("pending");
      expect(
        validators.listRegistrationsSchema.parse({ status: "done" }).status
      ).toBe("done");
      expect(
        validators.listRegistrationsSchema.parse({ status: "cancelled" }).status
      ).toBe("cancelled");
    });

    it("should reject invalid status", () => {
      expect(() =>
        validators.listRegistrationsSchema.parse({ status: "invalid" })
      ).toThrow();
    });
  });

  // ── cancelRegistrationSchema ──
  describe("cancelRegistrationSchema", () => {
    it("should accept valid registrationId", () => {
      const result = validators.cancelRegistrationSchema.parse({ registrationId: "reg-1" });
      expect(result.registrationId).toBe("reg-1");
    });

    it("should reject empty registrationId", () => {
      expect(() =>
        validators.cancelRegistrationSchema.parse({ registrationId: "" })
      ).toThrow();
    });
  });

  // ── getHospitalDetailSchema ──
  describe("getHospitalDetailSchema", () => {
    it("should accept valid hospitalId", () => {
      const result = validators.getHospitalDetailSchema.parse({ hospitalId: "h-1" });
      expect(result.hospitalId).toBe("h-1");
    });

    it("should reject empty hospitalId", () => {
      expect(() =>
        validators.getHospitalDetailSchema.parse({ hospitalId: "" })
      ).toThrow();
    });
  });

  // ── getDoctorDetailSchema ──
  describe("getDoctorDetailSchema", () => {
    it("should accept valid doctorId", () => {
      const result = validators.getDoctorDetailSchema.parse({ doctorId: "doc-1" });
      expect(result.doctorId).toBe("doc-1");
    });

    it("should reject empty doctorId", () => {
      expect(() =>
        validators.getDoctorDetailSchema.parse({ doctorId: "" })
      ).toThrow();
    });
  });

  // ── recommendDepartmentSchema ──
  describe("recommendDepartmentSchema", () => {
    it("should accept valid symptoms", () => {
      const result = validators.recommendDepartmentSchema.parse({
        symptoms: "发烧咳嗽三天",
      });
      expect(result.symptoms).toBe("发烧咳嗽三天");
    });

    it("should reject empty symptoms", () => {
      expect(() =>
        validators.recommendDepartmentSchema.parse({ symptoms: "" })
      ).toThrow();
    });
  });

  // ── getRegistrationGuideSchema ──
  describe("getRegistrationGuideSchema", () => {
    it("should accept empty object (hospitalId optional)", () => {
      const result = validators.getRegistrationGuideSchema.parse({});
      expect(result).toEqual({});
    });

    it("should accept optional hospitalId", () => {
      const result = validators.getRegistrationGuideSchema.parse({
        hospitalId: "h-1",
      });
      expect(result.hospitalId).toBe("h-1");
    });
  });

  // ── analyzeImageSchema ──
  describe("analyzeImageSchema", () => {
    it("should accept valid image data", () => {
      const result = validators.analyzeImageSchema.parse({
        imageUrl: "https://example.com/image.jpg",
      });
      expect(result.imageUrl).toBe("https://example.com/image.jpg");
      expect(result.imageType).toBeUndefined();
    });

    it("should accept optional imageType", () => {
      const result = validators.analyzeImageSchema.parse({
        imageUrl: "data:image/png;base64,...",
        imageType: "lab_report",
      });
      expect(result.imageType).toBe("lab_report");
    });

    it("should reject empty imageUrl", () => {
      expect(() =>
        validators.analyzeImageSchema.parse({ imageUrl: "" })
      ).toThrow();
    });
  });
});

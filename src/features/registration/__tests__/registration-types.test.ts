import { describe, it, expect } from "vitest";
import type {
  RegistrationStatus,
  TimeSlot,
  ScheduleType,
} from "@/features/registration/types";
import type {
  RegistrationDTO,
  CreateRegistrationDTO,
  RegistrationFilterDTO,
} from "@/features/registration/types";

describe("Registration types - RegistrationStatus", () => {
  it("should accept valid registration status values", () => {
    const pending: RegistrationStatus = "pending";
    const done: RegistrationStatus = "done";
    const cancelled: RegistrationStatus = "cancelled";
    expect(pending).toBe("pending");
    expect(done).toBe("done");
    expect(cancelled).toBe("cancelled");
  });
});

describe("Registration types - TimeSlot", () => {
  it("should accept valid time slot values", () => {
    const am: TimeSlot = "am";
    const pm: TimeSlot = "pm";
    const evening: TimeSlot = "evening";
    expect(am).toBe("am");
    expect(pm).toBe("pm");
    expect(evening).toBe("evening");
  });
});

describe("Registration types - ScheduleType", () => {
  it("should accept valid schedule type values", () => {
    const normal: ScheduleType = "normal";
    const expert: ScheduleType = "expert";
    const special: ScheduleType = "special";
    expect(normal).toBe("normal");
    expect(expert).toBe("expert");
    expect(special).toBe("special");
  });
});

describe("Registration types - RegistrationDTO", () => {
  it("should create a valid RegistrationDTO object", () => {
    const reg: RegistrationDTO = {
      id: "reg-1",
      patientId: "patient-1",
      profileId: "profile-1",
      doctorId: "doctor-1",
      scheduleId: "schedule-1",
      date: "2025-06-15",
      timeSlot: "am",
      type: "normal",
      status: "pending",
      createdAt: "2025-06-15T08:00:00Z",
    };
    expect(reg.id).toBe("reg-1");
    expect(reg.patientId).toBe("patient-1");
    expect(reg.status).toBe("pending");
    expect(reg.timeSlot).toBe("am");
    expect(reg.type).toBe("normal");
  });
});

describe("Registration types - CreateRegistrationDTO", () => {
  it("should create a valid CreateRegistrationDTO with ScheduleType", () => {
    const dto: CreateRegistrationDTO = {
      scheduleId: "schedule-1",
      profileId: "profile-1",
      type: "expert",
    };
    expect(dto.scheduleId).toBe("schedule-1");
    expect(dto.type).toBe("expert");
  });
});

describe("Registration types - RegistrationFilterDTO", () => {
  it("should create RegistrationFilterDTO with status filter", () => {
    const filter: RegistrationFilterDTO = {
      status: "pending",
      patientId: "patient-1",
      page: 1,
      pageSize: 10,
    };
    expect(filter.status).toBe("pending");
    expect(filter.patientId).toBe("patient-1");
  });

  it("should allow optional fields to be omitted", () => {
    const filter: RegistrationFilterDTO = {};
    expect(filter.status).toBeUndefined();
    expect(filter.patientId).toBeUndefined();
  });
});

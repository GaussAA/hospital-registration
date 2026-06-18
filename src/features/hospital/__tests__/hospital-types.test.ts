import { describe, it, expect } from "vitest";
import type {
  TimeSlot,
  ScheduleType,
  DoctorTitle,
} from "@/features/hospital/types";
import type {
  HospitalDTO,
  HospitalDetailDTO,
  DepartmentDTO,
  DoctorDTO,
  ScheduleDTO,
  CreateHospitalDTO,
  CreateDepartmentDTO,
  CreateDoctorDTO,
  CreateScheduleDTO,
  HospitalFilterDTO,
  DepartmentFilterDTO,
  DoctorFilterDTO,
  HospitalListParams,
  ScheduleSlotData,
} from "@/features/hospital/types";

describe("Hospital types - TimeSlot", () => {
  it("should accept valid time slot values", () => {
    const am: TimeSlot = "am";
    const pm: TimeSlot = "pm";
    const evening: TimeSlot = "evening";
    expect(am).toBe("am");
    expect(pm).toBe("pm");
    expect(evening).toBe("evening");
  });
});

describe("Hospital types - ScheduleType", () => {
  it("should accept valid schedule type values", () => {
    const normal: ScheduleType = "normal";
    const expert: ScheduleType = "expert";
    const special: ScheduleType = "special";
    expect(normal).toBe("normal");
    expect(expert).toBe("expert");
    expect(special).toBe("special");
  });
});

describe("Hospital types - DoctorTitle", () => {
  it("should accept valid doctor title values", () => {
    const titles: DoctorTitle[] = [
      "主任医师",
      "副主任医师",
      "主治医师",
      "住院医师",
      "医士",
    ];
    expect(titles).toHaveLength(5);
  });
});

describe("Hospital types - HospitalDTO", () => {
  it("should create a valid HospitalDTO object", () => {
    const hospital: HospitalDTO = {
      id: "h-1",
      name: "市人民医院",
      address: "北京路1号",
      city: "北京",
      level: "三级甲等",
      phone: "010-12345678",
      description: "综合医院",
      imageUrl: "https://example.com/hospital.jpg",
      departmentCount: 15,
      doctorCount: 120,
    };
    expect(hospital.id).toBe("h-1");
    expect(hospital.departmentCount).toBe(15);
    expect(hospital.doctorCount).toBe(120);
  });
});

describe("Hospital types - HospitalDetailDTO extends HospitalDTO", () => {
  it("should include createdAt date field", () => {
    const detail: HospitalDetailDTO = {
      id: "h-1",
      name: "市人民医院",
      address: "北京路1号",
      city: "北京",
      level: "三级甲等",
      phone: "010-12345678",
      description: "综合医院",
      imageUrl: "https://example.com/hospital.jpg",
      departmentCount: 15,
      doctorCount: 120,
      createdAt: new Date("2025-01-01"),
    };
    expect(detail.createdAt).toEqual(new Date("2025-01-01"));
  });
});

describe("Hospital types - DepartmentDTO", () => {
  it("should create a valid DepartmentDTO object", () => {
    const dept: DepartmentDTO = {
      id: "dept-1",
      name: "内科",
      description: "内科科室",
      hospitalId: "h-1",
    };
    expect(dept.name).toBe("内科");
    expect(dept.hospitalId).toBe("h-1");
  });
});

describe("Hospital types - DoctorDTO", () => {
  it("should create a valid DoctorDTO object", () => {
    const doctor: DoctorDTO = {
      id: "doc-1",
      name: "张医生",
      title: "主任医师",
      specialty: "心血管内科",
      introduction: "资深专家",
      avatarUrl: "",
      departmentId: "dept-1",
      hospitalId: "h-1",
    };
    expect(doctor.name).toBe("张医生");
    expect(doctor.specialty).toBe("心血管内科");
  });
});

describe("Hospital types - ScheduleDTO", () => {
  it("should create a valid ScheduleDTO object", () => {
    const schedule: ScheduleDTO = {
      id: "sched-1",
      doctorId: "doc-1",
      date: "2025-06-15",
      timeSlot: "am",
      quota: 20,
      bookedCount: 5,
      remaining: 15,
      type: "normal",
    };
    expect(schedule.remaining).toBe(15);
    expect(schedule.quota).toBe(20);
  });
});

describe("Hospital types - Create DTOs", () => {
  it("should create a valid CreateHospitalDTO with optional fields", () => {
    const dto: CreateHospitalDTO = {
      name: "新医院",
      address: "测试路",
      city: "上海",
      level: "二级",
      phone: "021-12345678",
    };
    expect(dto.description).toBeUndefined();
    expect(dto.imageUrl).toBeUndefined();
  });

  it("should create a valid CreateDepartmentDTO", () => {
    const dto: CreateDepartmentDTO = {
      name: "外科",
      hospitalId: "h-1",
    };
    expect(dto.description).toBeUndefined();
  });

  it("should create a valid CreateDoctorDTO", () => {
    const dto: CreateDoctorDTO = {
      name: "李医生",
      title: "主治医师",
      specialty: "骨科",
      departmentId: "dept-1",
      hospitalId: "h-1",
    };
    expect(dto.introduction).toBeUndefined();
    expect(dto.avatarUrl).toBeUndefined();
  });

  it("should create a valid CreateScheduleDTO with TimeSlot", () => {
    const dto: CreateScheduleDTO = {
      doctorId: "doc-1",
      date: "2025-06-20",
      timeSlot: "pm",
      type: "expert",
      quota: 10,
    };
    expect(dto.timeSlot).toBe("pm");
    expect(dto.quota).toBe(10);
  });
});

describe("Hospital types - Filter DTOs", () => {
  it("should create HospitalFilterDTO with optional filters", () => {
    const filter: HospitalFilterDTO = { city: "北京" };
    expect(filter.level).toBeUndefined();
    expect(filter.page).toBeUndefined();
  });
});

describe("Hospital types - HospitalListParams", () => {
  it("should create HospitalListParams with keyword filter", () => {
    const params: HospitalListParams = {
      keyword: "人民",
      page: 1,
      pageSize: 12,
    };
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(12);
  });
});

describe("Hospital types - ScheduleSlotData", () => {
  it("should create a valid ScheduleSlotData object", () => {
    const slot: ScheduleSlotData = {
      id: "slot-1",
      doctorId: "doc-1",
      date: "2025-06-15",
      timeSlot: "am",
      type: "normal",
      quota: 20,
      bookedCount: 5,
      remaining: 15,
    };
    expect(slot.timeSlot).toBe("am");
    expect(slot.bookedCount).toBe(5);
  });
});

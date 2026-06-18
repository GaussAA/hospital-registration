import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/shared/utils/errors";

// ─── Mock next/cache ────────────────────────────────────────────────
const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockPrisma = {
  hospital: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  department: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  doctor: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  schedule: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
};

vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

// ─── Mock getCurrentUser ────────────────────────────────────────────
const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}));
vi.mock("@/features/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

// ─── Import after mocks ─────────────────────────────────────────────
import {
  createHospital,
  updateHospital,
  deleteHospital,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listUsers,
} from "@/features/admin/actions";

// ─── Fixtures ───────────────────────────────────────────────────────
const mockHospitalData = {
  name: "市人民医院",
  address: "北京路1号",
  city: "北京",
  level: "三级甲等",
  phone: "010-12345678",
  description: "一家综合医院",
  imageUrl: "https://example.com/hospital.jpg",
};

const mockDepartmentData = {
  name: "内科",
  description: "内科科室",
  hospitalId: "hospital-1",
};

const mockDoctorData = {
  name: "张医生",
  title: "主任医师",
  specialty: "心血管",
  hospitalId: "hospital-1",
  departmentId: "dept-1",
};

const mockScheduleData = {
  date: "2025-01-15",
  timeSlot: "am" as const,
  type: "normal" as const,
  quota: 30,
  doctorId: "doctor-1",
};

// ─── Tests ──────────────────────────────────────────────────────────

describe("Admin CRUD Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Hospital ──
  describe("createHospital", () => {
    it("should create a hospital and revalidate path", async () => {
      mockPrisma.hospital.create.mockResolvedValue({ id: "hospital-1", ...mockHospitalData });

      const result = await createHospital(mockHospitalData);

      expect(result).toEqual({ id: "hospital-1", ...mockHospitalData });
      expect(mockPrisma.hospital.create).toHaveBeenCalledWith({ data: mockHospitalData });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/hospitals");
    });

    it("should throw when creation fails", async () => {
      mockPrisma.hospital.create.mockRejectedValue(new Error("数据库错误"));

      await expect(createHospital(mockHospitalData)).rejects.toThrow("数据库错误");
    });
  });

  describe("updateHospital", () => {
    it("should update an existing hospital", async () => {
      const existing = { id: "hospital-1", ...mockHospitalData };
      mockPrisma.hospital.findUnique.mockResolvedValue(existing);
      mockPrisma.hospital.update.mockResolvedValue({ ...existing, name: "市二医院" });

      const result = await updateHospital("hospital-1", { name: "市二医院" });

      expect(result.name).toBe("市二医院");
      expect(mockPrisma.hospital.findUnique).toHaveBeenCalledWith({ where: { id: "hospital-1" } });
      expect(mockPrisma.hospital.update).toHaveBeenCalledWith({
        where: { id: "hospital-1" },
        data: { name: "市二医院" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/hospitals");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/hospitals/hospital-1");
    });

    it("should throw NotFoundError when hospital does not exist", async () => {
      mockPrisma.hospital.findUnique.mockResolvedValue(null);

      await expect(updateHospital("non-existent", { name: "新名称" })).rejects.toThrow(NotFoundError);
      expect(mockPrisma.hospital.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteHospital", () => {
    it("should delete an existing hospital", async () => {
      const existing = { id: "hospital-1", ...mockHospitalData };
      mockPrisma.hospital.findUnique.mockResolvedValue(existing);
      mockPrisma.hospital.delete.mockResolvedValue(existing);

      await deleteHospital("hospital-1");

      expect(mockPrisma.hospital.findUnique).toHaveBeenCalledWith({ where: { id: "hospital-1" } });
      expect(mockPrisma.hospital.delete).toHaveBeenCalledWith({ where: { id: "hospital-1" } });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/hospitals");
    });

    it("should throw NotFoundError when hospital does not exist", async () => {
      mockPrisma.hospital.findUnique.mockResolvedValue(null);

      await expect(deleteHospital("non-existent")).rejects.toThrow(NotFoundError);
      expect(mockPrisma.hospital.delete).not.toHaveBeenCalled();
    });
  });

  // ── Department ──
  describe("createDepartment", () => {
    it("should create a department and revalidate paths", async () => {
      mockPrisma.department.create.mockResolvedValue({ id: "dept-1", ...mockDepartmentData });

      const result = await createDepartment(mockDepartmentData);

      expect(result).toEqual({ id: "dept-1", ...mockDepartmentData });
      expect(mockPrisma.department.create).toHaveBeenCalledWith({ data: mockDepartmentData });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/departments");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/hospitals/hospital-1");
    });
  });

  describe("updateDepartment", () => {
    it("should update an existing department and revalidate paths", async () => {
      const existing = { id: "dept-1", ...mockDepartmentData };
      mockPrisma.department.findUnique.mockResolvedValue(existing);
      mockPrisma.department.update.mockResolvedValue({ ...existing, name: "外科" });

      const result = await updateDepartment("dept-1", { name: "外科" });

      expect(result.name).toBe("外科");
      expect(mockPrisma.department.findUnique).toHaveBeenCalledWith({ where: { id: "dept-1" } });
      expect(mockPrisma.department.update).toHaveBeenCalledWith({
        where: { id: "dept-1" },
        data: { name: "外科" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/departments");
    });

    it("should throw NotFoundError when department does not exist", async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);

      await expect(updateDepartment("non-existent", { name: "外科" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteDepartment", () => {
    it("should delete an existing department and revalidate paths", async () => {
      const existing = { id: "dept-1", ...mockDepartmentData };
      mockPrisma.department.findUnique.mockResolvedValue(existing);
      mockPrisma.department.delete.mockResolvedValue(existing);

      await deleteDepartment("dept-1");

      expect(mockPrisma.department.delete).toHaveBeenCalledWith({ where: { id: "dept-1" } });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/departments");
    });

    it("should throw NotFoundError when department does not exist", async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);

      await expect(deleteDepartment("non-existent")).rejects.toThrow(NotFoundError);
    });
  });

  // ── Doctor ──
  describe("createDoctor", () => {
    it("should create a doctor and revalidate paths", async () => {
      mockPrisma.doctor.create.mockResolvedValue({ id: "doctor-1", ...mockDoctorData });

      const result = await createDoctor(mockDoctorData);

      expect(result).toEqual({ id: "doctor-1", ...mockDoctorData });
      expect(mockPrisma.doctor.create).toHaveBeenCalledWith({ data: mockDoctorData });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/doctors");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/hospitals/hospital-1/departments/dept-1");
    });
  });

  describe("updateDoctor", () => {
    it("should update an existing doctor", async () => {
      const existing = { id: "doctor-1", ...mockDoctorData };
      mockPrisma.doctor.findUnique.mockResolvedValue(existing);
      mockPrisma.doctor.update.mockResolvedValue({ ...existing, name: "李医生" });

      const result = await updateDoctor("doctor-1", { name: "李医生" });

      expect(result.name).toBe("李医生");
      expect(mockPrisma.doctor.findUnique).toHaveBeenCalledWith({ where: { id: "doctor-1" } });
      expect(mockPrisma.doctor.update).toHaveBeenCalledWith({
        where: { id: "doctor-1" },
        data: { name: "李医生" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/doctors");
    });

    it("should throw NotFoundError when doctor does not exist", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(updateDoctor("non-existent", { name: "李医生" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteDoctor", () => {
    it("should delete an existing doctor", async () => {
      const existing = { id: "doctor-1", ...mockDoctorData };
      mockPrisma.doctor.findUnique.mockResolvedValue(existing);
      mockPrisma.doctor.delete.mockResolvedValue(existing);

      await deleteDoctor("doctor-1");

      expect(mockPrisma.doctor.delete).toHaveBeenCalledWith({ where: { id: "doctor-1" } });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/doctors");
    });

    it("should throw NotFoundError when doctor does not exist", async () => {
      mockPrisma.doctor.findUnique.mockResolvedValue(null);

      await expect(deleteDoctor("non-existent")).rejects.toThrow(NotFoundError);
    });
  });

  // ── Schedule ──
  describe("createSchedule", () => {
    it("should create a schedule with bookedCount=0 and revalidate path", async () => {
      const created = { id: "schedule-1", ...mockScheduleData, bookedCount: 0 };
      mockPrisma.schedule.create.mockResolvedValue(created);

      const result = await createSchedule(mockScheduleData);

      expect(result).toEqual(created);
      expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
        data: { ...mockScheduleData, bookedCount: 0 },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/schedules");
    });
  });

  describe("updateSchedule", () => {
    it("should update an existing schedule", async () => {
      const existing = { id: "schedule-1", ...mockScheduleData, bookedCount: 0 };
      mockPrisma.schedule.findUnique.mockResolvedValue(existing);
      mockPrisma.schedule.update.mockResolvedValue({ ...existing, quota: 40 });

      const result = await updateSchedule("schedule-1", { quota: 40 });

      expect(result.quota).toBe(40);
      expect(mockPrisma.schedule.findUnique).toHaveBeenCalledWith({ where: { id: "schedule-1" } });
      expect(mockPrisma.schedule.update).toHaveBeenCalledWith({
        where: { id: "schedule-1" },
        data: { quota: 40 },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/schedules");
    });

    it("should throw NotFoundError when schedule does not exist", async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await expect(updateSchedule("non-existent", { quota: 40 })).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteSchedule", () => {
    it("should delete an existing schedule", async () => {
      const existing = { id: "schedule-1", ...mockScheduleData, bookedCount: 0 };
      mockPrisma.schedule.findUnique.mockResolvedValue(existing);
      mockPrisma.schedule.delete.mockResolvedValue(existing);

      await deleteSchedule("schedule-1");

      expect(mockPrisma.schedule.delete).toHaveBeenCalledWith({ where: { id: "schedule-1" } });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/schedules");
    });

    it("should throw NotFoundError when schedule does not exist", async () => {
      mockPrisma.schedule.findUnique.mockResolvedValue(null);

      await expect(deleteSchedule("non-existent")).rejects.toThrow(NotFoundError);
    });
  });
});

// ─── listUsers ───────────────────────────────────────────────────────
describe("listUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return users when current user is admin", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    const mockUsers = [
      { id: "user-1", name: "张三", email: "zhang@test.com", phone: "13800138001", role: "user", createdAt: new Date("2025-01-01") },
      { id: "user-2", name: "李四", email: "li@test.com", phone: "13800138002", role: "user", createdAt: new Date("2025-01-02") },
    ];
    mockPrisma.user.findMany.mockResolvedValue(mockUsers);

    const result = await listUsers();

    expect(result).toEqual(mockUsers);
    expect(result).toHaveLength(2);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should throw error when user is not logged in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(listUsers()).rejects.toThrow("无权访问");
  });

  it("should throw error when user is not admin", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", role: "user" });

    await expect(listUsers()).rejects.toThrow("无权访问");
  });

  it("should throw error when getCurrentUser fails", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("认证失败"));

    await expect(listUsers()).rejects.toThrow("认证失败");
  });
});

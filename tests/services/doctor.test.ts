import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/lib/utils/errors";

// ─── Mock Prisma & DB ────────────────────────────────────────────────
const mockPrisma = {
  department: {
    findUnique: vi.fn(),
  },
  doctor: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const { listDoctorsByDepartment, getDoctorById } = await import(
  "@/lib/services/doctor.service"
);

// ─── Fixtures ─────────────────────────────────────────────────────────
function makeDoctor(overrides: Record<string, unknown> = {}) {
  return {
    id: "doctor-1",
    name: "张医生",
    title: "主任医师",
    specialty: "心血管内科",
    introduction: "资深心血管专家",
    avatarUrl: "https://example.com/avatar.jpg",
    departmentId: "dept-1",
    hospitalId: "hospital-1",
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────
describe("listDoctorsByDepartment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return list of doctors for a department", async () => {
    const doctors = [
      makeDoctor({ id: "doctor-1", name: "张医生" }),
      makeDoctor({ id: "doctor-2", name: "李医生", title: "副主任医师" }),
    ];
    mockPrisma.department.findUnique.mockResolvedValue({ id: "dept-1", name: "内科" });
    mockPrisma.doctor.findMany.mockResolvedValue(doctors);

    const result = await listDoctorsByDepartment("dept-1");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("张医生");
    expect(result[1].title).toBe("副主任医师");
    expect(mockPrisma.doctor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { departmentId: "dept-1" },
        orderBy: { name: "asc" },
      }),
    );
  });

  it("should throw NotFoundError when department does not exist", async () => {
    mockPrisma.department.findUnique.mockResolvedValue(null);

    await expect(listDoctorsByDepartment("dept-nonexistent")).rejects.toThrow(NotFoundError);
  });

  it("should return empty array when department has no doctors", async () => {
    mockPrisma.department.findUnique.mockResolvedValue({ id: "dept-1", name: "内科" });
    mockPrisma.doctor.findMany.mockResolvedValue([]);

    const result = await listDoctorsByDepartment("dept-1");

    expect(result).toHaveLength(0);
  });

  it("should order doctors by name ascending", async () => {
    const doctors = [
      makeDoctor({ id: "doctor-2", name: "李医生" }),
      makeDoctor({ id: "doctor-1", name: "张医生" }),
    ];
    mockPrisma.department.findUnique.mockResolvedValue({ id: "dept-1", name: "内科" });
    mockPrisma.doctor.findMany.mockResolvedValue(doctors);

    await listDoctorsByDepartment("dept-1");

    expect(mockPrisma.doctor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } }),
    );
  });
});

describe("getDoctorById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return doctor detail when found", async () => {
    const doctor = makeDoctor({
      department: { name: "内科" },
      hospital: { name: "市人民医院" },
    });
    mockPrisma.doctor.findUnique.mockResolvedValue(doctor);

    const result = await getDoctorById("doctor-1");

    expect(result).toBeDefined();
    expect(result.id).toBe("doctor-1");
    expect(result.name).toBe("张医生");
    expect(result.departmentName).toBe("内科");
    expect(result.hospitalName).toBe("市人民医院");
    expect(mockPrisma.doctor.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "doctor-1" },
        include: {
          department: { select: { name: true } },
          hospital: { select: { name: true } },
        },
      }),
    );
  });

  it("should throw NotFoundError when doctor does not exist", async () => {
    mockPrisma.doctor.findUnique.mockResolvedValue(null);

    await expect(getDoctorById("doctor-nonexistent")).rejects.toThrow(NotFoundError);
  });
});

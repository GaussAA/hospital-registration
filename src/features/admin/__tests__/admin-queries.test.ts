import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ────────────────────────────────────────────────────
const mockPrisma = {
  hospital: { count: vi.fn() },
  department: { count: vi.fn() },
  doctor: { count: vi.fn() },
  registration: { count: vi.fn(), findMany: vi.fn() },
  user: { count: vi.fn() },
};

vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

// ─── Import after mocks ─────────────────────────────────────────────
import { getDashboardStats, getAdminOverview } from "@/features/admin/queries";

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return dashboard statistics", async () => {
    mockPrisma.hospital.count.mockResolvedValue(5);
    mockPrisma.department.count.mockResolvedValue(20);
    mockPrisma.doctor.count.mockResolvedValue(100);
    mockPrisma.registration.count
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(30);
    mockPrisma.user.count.mockResolvedValue(1000);

    const stats = await getDashboardStats();

    expect(stats).toEqual({
      hospitalCount: 5,
      departmentCount: 20,
      doctorCount: 100,
      registrationCount: 500,
      todayRegistrationCount: 10,
      pendingCount: 30,
      userCount: 1000,
    });

    expect(mockPrisma.hospital.count).toHaveBeenCalledTimes(1);
    expect(mockPrisma.department.count).toHaveBeenCalledTimes(1);
    expect(mockPrisma.doctor.count).toHaveBeenCalledTimes(1);
    expect(mockPrisma.registration.count).toHaveBeenCalledTimes(3);
    expect(mockPrisma.user.count).toHaveBeenCalledTimes(1);
  });

  it("should use today's date for todayRegistrationCount", async () => {
    const today = new Date().toISOString().split("T")[0];

    mockPrisma.hospital.count.mockResolvedValue(0);
    mockPrisma.department.count.mockResolvedValue(0);
    mockPrisma.doctor.count.mockResolvedValue(0);
    mockPrisma.registration.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);

    await getDashboardStats();

    expect(mockPrisma.registration.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { date: today } })
    );
  });

  it("should query pending registrations correctly", async () => {
    mockPrisma.hospital.count.mockResolvedValue(0);
    mockPrisma.department.count.mockResolvedValue(0);
    mockPrisma.doctor.count.mockResolvedValue(0);
    mockPrisma.registration.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);

    await getDashboardStats();

    expect(mockPrisma.registration.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "pending" } })
    );
  });

  it("should handle zero counts gracefully", async () => {
    mockPrisma.hospital.count.mockResolvedValue(0);
    mockPrisma.department.count.mockResolvedValue(0);
    mockPrisma.doctor.count.mockResolvedValue(0);
    mockPrisma.registration.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);

    const stats = await getDashboardStats();

    expect(stats).toEqual({
      hospitalCount: 0,
      departmentCount: 0,
      doctorCount: 0,
      registrationCount: 0,
      todayRegistrationCount: 0,
      pendingCount: 0,
      userCount: 0,
    });
  });

  it("should propagate prisma errors", async () => {
    mockPrisma.hospital.count.mockRejectedValue(new Error("数据库连接失败"));

    await expect(getDashboardStats()).rejects.toThrow("数据库连接失败");
  });
});

describe("getAdminOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return overview data with stats and recent registrations", async () => {
    mockPrisma.hospital.count.mockResolvedValue(5);
    mockPrisma.department.count.mockResolvedValue(20);
    mockPrisma.doctor.count.mockResolvedValue(100);
    mockPrisma.registration.count
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(30);
    mockPrisma.user.count.mockResolvedValue(1000);
    mockPrisma.registration.findMany.mockResolvedValue([
      {
        id: "reg-1",
        date: "2025-01-15",
        status: "confirmed",
        createdAt: new Date("2025-01-15T10:00:00Z"),
        patient: { name: "张三" },
        doctor: {
          name: "张医生",
          hospital: { name: "市人民医院" },
        },
      },
    ]);

    const overview = await getAdminOverview();

    expect(overview.stats).toEqual({
      hospitalCount: 5,
      departmentCount: 20,
      doctorCount: 100,
      registrationCount: 500,
      todayRegistrationCount: 10,
      pendingCount: 30,
      userCount: 1000,
    });
    expect(overview.recentRegistrations).toHaveLength(1);
    expect(overview.recentRegistrations[0]).toEqual({
      id: "reg-1",
      patientName: "张三",
      doctorName: "张医生",
      hospitalName: "市人民医院",
      date: "2025-01-15",
      status: "confirmed",
      createdAt: new Date("2025-01-15T10:00:00Z"),
    });
  });

  it("should return empty recentRegistrations when none exist", async () => {
    mockPrisma.hospital.count.mockResolvedValue(0);
    mockPrisma.department.count.mockResolvedValue(0);
    mockPrisma.doctor.count.mockResolvedValue(0);
    mockPrisma.registration.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.registration.findMany.mockResolvedValue([]);

    const overview = await getAdminOverview();

    expect(overview.recentRegistrations).toEqual([]);
  });

  it("should only fetch 10 recent registrations ordered by createdAt desc", async () => {
    mockPrisma.hospital.count.mockResolvedValue(0);
    mockPrisma.department.count.mockResolvedValue(0);
    mockPrisma.doctor.count.mockResolvedValue(0);
    mockPrisma.registration.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.registration.findMany.mockResolvedValue([]);

    await getAdminOverview();

    expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true } },
        doctor: {
          select: {
            name: true,
            hospital: { select: { name: true } },
          },
        },
      },
    });
  });

  it("should propagate errors from getDashboardStats", async () => {
    mockPrisma.hospital.count.mockRejectedValue(new Error("统计查询失败"));

    await expect(getAdminOverview()).rejects.toThrow("统计查询失败");
  });
});

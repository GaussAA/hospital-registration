import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError } from "@/shared/utils/errors";

// ─── Mock Cache (bypass Redis serialization) ─────────────────────────
vi.mock("@/shared/cache", () => ({
  cacheAside: vi.fn((_key: string, _ttl: number, fetchFn: () => Promise<unknown>) => fetchFn()),
  CACHE_KEYS: {
    HOSPITAL_DETAIL: vi.fn((id: string) => `hospitals:detail:${id}`),
  },
  CACHE_TTL: { HOSPITAL_DETAIL: 600 },
}));

// ─── Mock Prisma & DB ────────────────────────────────────────────────
const mockPrisma = {
  hospital: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const { listHospitals, getHospitalById } = await import(
  "@/features/hospital/queries"
);

// ─── Fixtures ─────────────────────────────────────────────────────────
function makeHospital(overrides: Record<string, unknown> = {}) {
  return {
    id: "hospital-1",
    name: "市人民医院",
    address: "北京路1号",
    city: "北京",
    level: "三级甲等",
    phone: "010-12345678",
    description: "一家综合医院",
    imageUrl: "https://example.com/hospital.jpg",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    _count: { departments: 15, doctors: 120 },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────
describe("listHospitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated hospital list", async () => {
    const hospitals = [makeHospital(), makeHospital({ id: "hospital-2", name: "市二医院" })];
    mockPrisma.hospital.findMany.mockResolvedValue(hospitals);
    mockPrisma.hospital.count.mockResolvedValue(2);

    const result = await listHospitals({ page: 1, pageSize: 12 });

    expect(result.list).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(12);
    expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 12,
      }),
    );
  });

  it("should filter by city", async () => {
    mockPrisma.hospital.findMany.mockResolvedValue([makeHospital()]);
    mockPrisma.hospital.count.mockResolvedValue(1);

    await listHospitals({ city: "北京" });

    expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { city: "北京" },
      }),
    );
  });

  it("should filter by level", async () => {
    mockPrisma.hospital.findMany.mockResolvedValue([makeHospital()]);
    mockPrisma.hospital.count.mockResolvedValue(1);

    await listHospitals({ level: "三级甲等" });

    expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { level: "三级甲等" },
      }),
    );
  });

  it("should filter by keyword (name search)", async () => {
    mockPrisma.hospital.findMany.mockResolvedValue([makeHospital()]);
    mockPrisma.hospital.count.mockResolvedValue(1);

    await listHospitals({ keyword: "人民" });

    expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: "人民" } },
      }),
    );
  });

  it("should combine multiple filters", async () => {
    mockPrisma.hospital.findMany.mockResolvedValue([makeHospital()]);
    mockPrisma.hospital.count.mockResolvedValue(1);

    await listHospitals({ city: "北京", level: "三级甲等", keyword: "人民" });

    expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { city: "北京", level: "三级甲等", name: { contains: "人民" } },
      }),
    );
  });

  it("should apply pagination correctly", async () => {
    mockPrisma.hospital.findMany.mockResolvedValue([]);
    mockPrisma.hospital.count.mockResolvedValue(0);

    await listHospitals({ page: 3, pageSize: 5 });

    expect(mockPrisma.hospital.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });

  it("should return empty list when no hospitals match", async () => {
    mockPrisma.hospital.findMany.mockResolvedValue([]);
    mockPrisma.hospital.count.mockResolvedValue(0);

    const result = await listHospitals({ city: "不存在城市" });

    expect(result.list).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should map _count fields to departmentCount and doctorCount", async () => {
    const hospital = makeHospital({ _count: { departments: 5, doctors: 30 } });
    mockPrisma.hospital.findMany.mockResolvedValue([hospital]);
    mockPrisma.hospital.count.mockResolvedValue(1);

    const result = await listHospitals({});

    expect(result.list[0].departmentCount).toBe(5);
    expect(result.list[0].doctorCount).toBe(30);
  });
});

describe("getHospitalById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return hospital detail when found", async () => {
    const hospital = makeHospital();
    mockPrisma.hospital.findUnique.mockResolvedValue(hospital);

    const result = await getHospitalById("hospital-1");

    expect(result).toBeDefined();
    expect(result.id).toBe("hospital-1");
    expect(result.name).toBe("市人民医院");
    expect(result.departmentCount).toBe(15);
    expect(result.doctorCount).toBe(120);
    expect(result.createdAt).toEqual(new Date("2025-01-01T00:00:00Z"));
  });

  it("should throw NotFoundError when hospital does not exist", async () => {
    mockPrisma.hospital.findUnique.mockResolvedValue(null);

    await expect(getHospitalById("hospital-nonexistent")).rejects.toThrow(NotFoundError);
  });
});

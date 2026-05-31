import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundError, ConflictError } from "@/lib/utils/errors";

// ─── Mock Prisma & DB ────────────────────────────────────────────────
const mockPrisma = {
  $transaction: vi.fn(),
  schedule: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  registration: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// Import after mocking
const {
  createRegistration,
  listRegistrations,
  getRegistrationById,
  cancelRegistration,
} = await import("@/lib/services/registration.service");

// ─── Fixtures ─────────────────────────────────────────────────────────
const mockSchedule = {
  id: "schedule-1",
  doctorId: "doctor-1",
  date: "2025-06-15",
  timeSlot: "am",
  quota: 20,
  bookedCount: 5,
  type: "normal",
};

const mockDoctor = {
  id: "doctor-1",
  name: "张医生",
  title: "主任医师",
  specialty: "心血管内科",
  introduction: "资深专家",
  avatarUrl: "",
  departmentId: "dept-1",
  hospitalId: "hospital-1",
  department: { id: "dept-1", name: "内科", description: "", hospitalId: "hospital-1" },
  hospital: { id: "hospital-1", name: "市人民医院", address: "北京路1号", city: "北京", level: "三级甲等" },
};

const mockProfile = {
  id: "profile-1",
  userId: "patient-1",
  name: "张三",
  idCard: "110101199001011234",
  phone: "13800138000",
  gender: "male",
};

function makeRegistration(overrides: Record<string, unknown> = {}) {
  return {
    id: "reg-1",
    patientId: "patient-1",
    profileId: "profile-1",
    doctorId: "doctor-1",
    scheduleId: "schedule-1",
    date: "2025-06-15",
    timeSlot: "am",
    type: "normal",
    status: "pending",
    createdAt: new Date("2025-06-15T08:00:00Z"),
    doctor: mockDoctor,
    profile: mockProfile,
    schedule: mockSchedule,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────
describe("createRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a registration successfully", async () => {
    // Transaction callback receives a tx object (same as mockPrisma)
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.schedule.findUnique.mockResolvedValue(mockSchedule);
    mockPrisma.registration.findFirst.mockResolvedValue(null);
    mockPrisma.schedule.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.registration.create.mockResolvedValue(makeRegistration());

    const result = await createRegistration(
      "patient-1",
      "schedule-1",
      "profile-1",
      "normal",
    );

    expect(result).toBeDefined();
    expect(result.patientId).toBe("patient-1");
    expect(result.status).toBe("pending");
    expect(mockPrisma.schedule.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "schedule-1", bookedCount: { lt: 20 } },
        data: { bookedCount: { increment: 1 } },
      }),
    );
  });

  it("should throw ConflictError when schedule is full", async () => {
    const fullSchedule = { ...mockSchedule, bookedCount: 20, quota: 20 };
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.schedule.findUnique.mockResolvedValue(fullSchedule);

    await expect(
      createRegistration("patient-1", "schedule-1", "profile-1", "normal"),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw NotFoundError when schedule does not exist", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.schedule.findUnique.mockResolvedValue(null);

    await expect(
      createRegistration("patient-1", "schedule-1", "profile-1", "normal"),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError when duplicate booking on same date+slot", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.schedule.findUnique.mockResolvedValue(mockSchedule);
    mockPrisma.registration.findFirst.mockResolvedValue(makeRegistration());

    await expect(
      createRegistration("patient-1", "schedule-1", "profile-1", "normal"),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when optimistic lock fails (race condition)", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.schedule.findUnique.mockResolvedValue(mockSchedule);
    mockPrisma.registration.findFirst.mockResolvedValue(null);
    mockPrisma.schedule.updateMany.mockResolvedValue({ count: 0 }); // No rows updated

    await expect(
      createRegistration("patient-1", "schedule-1", "profile-1", "normal"),
    ).rejects.toThrow(ConflictError);
  });
});

describe("listRegistrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated registrations for a patient", async () => {
    const registrations = [
      makeRegistration({ id: "reg-1", date: "2025-06-15" }),
      makeRegistration({ id: "reg-2", date: "2025-06-14" }),
    ];
    mockPrisma.registration.findMany.mockResolvedValue(registrations);
    mockPrisma.registration.count.mockResolvedValue(2);

    const result = await listRegistrations("patient-1");

    expect(result.list).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(mockPrisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: "patient-1" },
        skip: 0,
        take: 10,
      }),
    );
  });

  it("should filter by status when provided", async () => {
    const registrations = [
      makeRegistration({ id: "reg-1", status: "pending" }),
    ];
    mockPrisma.registration.findMany.mockResolvedValue(registrations);
    mockPrisma.registration.count.mockResolvedValue(1);

    const result = await listRegistrations("patient-1", "pending");

    expect(result.list).toHaveLength(1);
    expect(mockPrisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: "patient-1", status: "pending" },
      }),
    );
  });

  it("should apply pagination correctly", async () => {
    mockPrisma.registration.findMany.mockResolvedValue([]);
    mockPrisma.registration.count.mockResolvedValue(0);

    await listRegistrations("patient-1", undefined, 3, 5);

    expect(mockPrisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      }),
    );
  });

  it("should return empty list when no registrations exist", async () => {
    mockPrisma.registration.findMany.mockResolvedValue([]);
    mockPrisma.registration.count.mockResolvedValue(0);

    const result = await listRegistrations("patient-1");

    expect(result.list).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe("getRegistrationById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return registration when found", async () => {
    mockPrisma.registration.findUnique.mockResolvedValue(makeRegistration());

    const result = await getRegistrationById("reg-1");

    expect(result).toBeDefined();
    expect(result.id).toBe("reg-1");
    expect(mockPrisma.registration.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "reg-1" },
      }),
    );
  });

  it("should throw NotFoundError when registration does not exist", async () => {
    mockPrisma.registration.findUnique.mockResolvedValue(null);

    await expect(getRegistrationById("reg-nonexistent")).rejects.toThrow(NotFoundError);
  });
});

describe("cancelRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cancel a pending registration successfully", async () => {
    const existingRegistration = makeRegistration();
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.registration.findUnique
      .mockResolvedValueOnce(existingRegistration); // find inside transaction
    mockPrisma.schedule.update.mockResolvedValue({});
    mockPrisma.registration.update.mockResolvedValue(
      makeRegistration({ status: "cancelled" }),
    );

    const result = await cancelRegistration("reg-1", "patient-1");

    expect(result.status).toBe("cancelled");
    expect(mockPrisma.schedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "schedule-1" },
        data: { bookedCount: { decrement: 1 } },
      }),
    );
  });

  it("should throw NotFoundError when registration does not exist", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.registration.findUnique.mockResolvedValue(null);

    await expect(cancelRegistration("reg-nonexistent", "patient-1")).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when patientId does not match (unauthorized cancel)", async () => {
    const otherPatientReg = makeRegistration({ patientId: "patient-2" });
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.registration.findUnique.mockResolvedValue(otherPatientReg);

    await expect(cancelRegistration("reg-1", "patient-1")).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError when registration is already cancelled", async () => {
    const cancelledReg = makeRegistration({ status: "cancelled" });
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.registration.findUnique.mockResolvedValue(cancelledReg);

    await expect(cancelRegistration("reg-1", "patient-1")).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when registration is already done (completed)", async () => {
    const doneReg = makeRegistration({ status: "done" });
    mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
      return cb(mockPrisma);
    });
    mockPrisma.registration.findUnique.mockResolvedValue(doneReg);

    await expect(cancelRegistration("reg-1", "patient-1")).rejects.toThrow(ConflictError);
  });
});

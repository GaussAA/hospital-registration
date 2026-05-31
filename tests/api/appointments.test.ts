import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ───────────────────────────────────────────────────
const { mockVerifyToken } = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
}));

// Mock JWT module (used by auth middleware)
vi.mock("@/lib/utils/jwt", () => ({
  verifyToken: mockVerifyToken,
}));

// Mock service layer
const { mockCreateRegistration, mockListRegistrations, mockGetRegistrationById, mockCancelRegistration } =
  vi.hoisted(() => ({
    mockCreateRegistration: vi.fn(),
    mockListRegistrations: vi.fn(),
    mockGetRegistrationById: vi.fn(),
    mockCancelRegistration: vi.fn(),
  }));

vi.mock("@/lib/services/registration.service", () => ({
  createRegistration: mockCreateRegistration,
  listRegistrations: mockListRegistrations,
  getRegistrationById: mockGetRegistrationById,
  cancelRegistration: mockCancelRegistration,
}));

// Mock hospital service
const { mockListHospitals, mockGetHospitalById } = vi.hoisted(() => ({
  mockListHospitals: vi.fn(),
  mockGetHospitalById: vi.fn(),
}));

vi.mock("@/lib/services/hospital.service", () => ({
  listHospitals: mockListHospitals,
  getHospitalById: mockGetHospitalById,
}));

// Mock next/cache (revalidatePath requires Next.js runtime)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ── Imports after mocks ─────────────────────────────────────────────
import { GET as GET_APPOINTMENTS, POST as POST_APPOINTMENTS } from "@/app/api/appointments/route";
import { GET as GET_HOSPITALS } from "@/app/api/hospitals/route";
import { GET as GET_HOSPITAL_BY_ID } from "@/app/api/hospitals/[hospitalId]/route";
import { POST as POST_CANCEL } from "@/app/api/appointments/[id]/cancel/route";
import { GET as GET_APPOINTMENT_BY_ID } from "@/app/api/appointments/[id]/route";

// ── Helpers ─────────────────────────────────────────────────────────
interface RequestWithMockCookies extends Request {
  cookies: { get: (name: string) => { value: string } | undefined };
  nextUrl: URL;
}

function createRequest(
  url: string,
  opts: {
    method?: string;
    body?: unknown;
    cookieToken?: string;
    headers?: Record<string, string>;
  } = {},
): RequestWithMockCookies {
  const { method = "GET", body, cookieToken, headers = {} } = opts;
  const req = new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Mock cookies (used by auth middleware)
  const cookiesGet = vi.fn(() =>
    cookieToken ? { value: cookieToken } : undefined,
  );
  Object.defineProperty(req, "cookies", {
    value: { get: cookiesGet },
    writable: true,
  });

  // Mock nextUrl (used by apiHandler error logging)
  Object.defineProperty(req, "nextUrl", {
    value: new URL(url),
    writable: true,
  });

  return req as RequestWithMockCookies;
}

/** Create a route context with the given params */
function routeContext(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}

const mockAppointment = {
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
  doctor: {
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
  },
  profile: {
    id: "profile-1",
    userId: "patient-1",
    name: "张三",
    idCard: "110101199001011234",
    phone: "13800138000",
    gender: "male",
  },
};

// ── Tests ───────────────────────────────────────────────────────────
describe("GET /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue({ userId: "patient-1", role: "patient" });
  });

  it("should return registrations list for authenticated user", async () => {
    mockListRegistrations.mockResolvedValue({
      list: [mockAppointment],
      total: 1,
      page: 1,
      pageSize: 10,
    });

    const req = createRequest("http://localhost:3000/api/appointments", {
      cookieToken: "valid-token",
    });
    const res = await GET_APPOINTMENTS(req, routeContext());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.code).toBe(0);
    expect(json.data.list).toHaveLength(1);
    expect(json.data.total).toBe(1);
  });

  it("should return 401 without auth token", async () => {
    const req = createRequest("http://localhost:3000/api/appointments");
    const res = await GET_APPOINTMENTS(req, routeContext());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.code).toBe(40100);
  });

  it("should filter by status query param", async () => {
    mockListRegistrations.mockResolvedValue({
      list: [mockAppointment],
      total: 1,
      page: 1,
      pageSize: 10,
    });

    const req = createRequest(
      "http://localhost:3000/api/appointments?status=pending",
      { cookieToken: "valid-token" },
    );
    const res = await GET_APPOINTMENTS(req, routeContext());
    await res.json();

    expect(mockListRegistrations).toHaveBeenCalledWith(
      "patient-1",
      "pending",
      1,
      10,
    );
  });

  it("should apply pagination from query params", async () => {
    mockListRegistrations.mockResolvedValue({
      list: [],
      total: 0,
      page: 2,
      pageSize: 5,
    });

    const req = createRequest(
      "http://localhost:3000/api/appointments?page=2&pageSize=5",
      { cookieToken: "valid-token" },
    );
    const res = await GET_APPOINTMENTS(req, routeContext());
    await res.json();

    expect(mockListRegistrations).toHaveBeenCalledWith(
      "patient-1",
      undefined,
      2,
      5,
    );
  });
});

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue({ userId: "patient-1", role: "patient" });
  });

  it("should create appointment with valid data", async () => {
    mockCreateRegistration.mockResolvedValue(mockAppointment);

    const req = createRequest(
      "http://localhost:3000/api/appointments",
      {
        method: "POST",
        body: {
          scheduleId: "schedule-1",
          profileId: "profile-1",
          type: "normal",
        },
        cookieToken: "valid-token",
      },
    );
    const res = await POST_APPOINTMENTS(req, routeContext());
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.code).toBe(0);
    expect(json.data.registration.id).toBe("reg-1");
  });

  it("should return 401 without auth for POST", async () => {
    const req = createRequest(
      "http://localhost:3000/api/appointments",
      {
        method: "POST",
        body: { scheduleId: "schedule-1", profileId: "profile-1", type: "normal" },
      },
    );
    const res = await POST_APPOINTMENTS(req, routeContext());

    expect(res.status).toBe(401);
  });

  it("should return 400 when required fields are missing", async () => {
    const req = createRequest(
      "http://localhost:3000/api/appointments",
      {
        method: "POST",
        body: {},
        cookieToken: "valid-token",
      },
    );
    const res = await POST_APPOINTMENTS(req, routeContext());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe(40001);
  });

  it("should return 400 when type is invalid", async () => {
    const req = createRequest(
      "http://localhost:3000/api/appointments",
      {
        method: "POST",
        body: {
          scheduleId: "schedule-1",
          profileId: "profile-1",
          type: "invalid-type",
        },
        cookieToken: "valid-token",
      },
    );
    const res = await POST_APPOINTMENTS(req, routeContext());

    expect(res.status).toBe(400);
  });
});

describe("GET /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue({ userId: "patient-1", role: "patient" });
  });

  it("should return appointment by id", async () => {
    mockGetRegistrationById.mockResolvedValue(mockAppointment);

    const req = createRequest(
      "http://localhost:3000/api/appointments/reg-1",
      { cookieToken: "valid-token" },
    );
    const res = await GET_APPOINTMENT_BY_ID(req, routeContext({ id: "reg-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.registration.id).toBe("reg-1");
  });

  it("should return 401 without auth", async () => {
    const req = createRequest("http://localhost:3000/api/appointments/reg-1");
    const res = await GET_APPOINTMENT_BY_ID(req, routeContext({ id: "reg-1" }));

    expect(res.status).toBe(401);
  });

  it("should return 404 when registration belongs to another user", async () => {
    const otherUserApp = { ...mockAppointment, patientId: "patient-2" };
    mockGetRegistrationById.mockResolvedValue(otherUserApp);

    const req = createRequest(
      "http://localhost:3000/api/appointments/reg-1",
      { cookieToken: "valid-token" },
    );
    const res = await GET_APPOINTMENT_BY_ID(req, routeContext({ id: "reg-1" }));

    expect(res.status).toBe(404);
  });
});

describe("POST /api/appointments/[id]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue({ userId: "patient-1", role: "patient" });
  });

  it("should cancel an appointment successfully", async () => {
    mockCancelRegistration.mockResolvedValue({
      ...mockAppointment,
      status: "cancelled",
    });

    const req = createRequest(
      "http://localhost:3000/api/appointments/reg-1/cancel",
      { method: "POST", cookieToken: "valid-token" },
    );
    const res = await POST_CANCEL(req, routeContext({ id: "reg-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.registration.status).toBe("cancelled");
    expect(mockCancelRegistration).toHaveBeenCalledWith("reg-1", "patient-1");
  });

  it("should return 401 without auth", async () => {
    const req = createRequest(
      "http://localhost:3000/api/appointments/reg-1/cancel",
      { method: "POST" },
    );
    const res = await POST_CANCEL(req, routeContext({ id: "reg-1" }));

    expect(res.status).toBe(401);
  });
});

describe("GET /api/hospitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return hospital list without auth", async () => {
    mockListHospitals.mockResolvedValue({
      list: [
        { id: "h-1", name: "市人民医院", departmentCount: 10, doctorCount: 50 },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
    });

    const req = createRequest("http://localhost:3000/api/hospitals");
    const res = await GET_HOSPITALS(req, routeContext());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.code).toBe(0);
    expect(json.data.list).toHaveLength(1);
  });

  it("should pass query params to service", async () => {
    mockListHospitals.mockResolvedValue({
      list: [],
      total: 0,
      page: 1,
      pageSize: 12,
    });

    const req = createRequest(
      "http://localhost:3000/api/hospitals?city=北京&level=三级甲等&keyword=人民",
    );
    await GET_HOSPITALS(req, routeContext());

    expect(mockListHospitals).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "北京",
        level: "三级甲等",
        keyword: "人民",
      }),
    );
  });

  it("should return 400 on invalid query params", async () => {
    const req = createRequest(
      "http://localhost:3000/api/hospitals?pageSize=999",
    );
    const res = await GET_HOSPITALS(req, routeContext());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe(40001);
  });
});

describe("GET /api/hospitals/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return hospital by id (no auth needed)", async () => {
    mockGetHospitalById.mockResolvedValue({
      id: "hospital-1",
      name: "市人民医院",
      address: "北京路1号",
      city: "北京",
      level: "三级甲等",
      phone: "010-12345678",
      description: "综合医院",
      imageUrl: "",
      departmentCount: 10,
      doctorCount: 50,
      createdAt: new Date(),
    });

    const req = createRequest("http://localhost:3000/api/hospitals/hospital-1");
    const res = await GET_HOSPITAL_BY_ID(req, routeContext({ hospitalId: "hospital-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe("hospital-1");
  });
});

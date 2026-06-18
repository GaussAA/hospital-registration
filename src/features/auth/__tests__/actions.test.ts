import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthError } from "@/shared/utils/errors";

// ─── Mocks ────────────────────────────────────────────────────────────

// Mock the queries module that actions delegates to
const mockQueryRegister = vi.fn();
const mockQueryLogin = vi.fn();
const mockGetPatientProfilesByUser = vi.fn();
const mockQueryCreatePatientProfile = vi.fn();
vi.mock("@/features/auth/queries", () => ({
  register: mockQueryRegister,
  login: mockQueryLogin,
  getPatientProfilesByUser: mockGetPatientProfilesByUser,
  createPatientProfile: mockQueryCreatePatientProfile,
}));

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock jwt utils
const mockVerifyToken = vi.fn();
vi.mock("@/shared/utils/jwt", () => ({
  verifyToken: mockVerifyToken,
}));

// Mock DB
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  patientProfile: {
    update: vi.fn(),
    delete: vi.fn(),
  },
};
vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

// Import after mocks
const {
  login,
  register,
  logout,
  getCurrentUser,
  getPatientProfiles,
  createPatientProfile,
  updatePatientProfile,
  deletePatientProfile,
} = await import("@/features/auth/actions");

// ─── Fixtures ─────────────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  name: "张三",
  email: "zhangsan@example.com",
  phone: null,
  role: "patient",
};

const mockProfile = {
  id: "profile-1",
  name: "张三",
  idCard: "110101199001011234",
  phone: "13800138000",
  gender: "male",
};

// ─── Tests: login ─────────────────────────────────────────────────────

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate to queryLogin and return result", async () => {
    const expected = { user: mockUser, token: "jwt-token" };
    mockQueryLogin.mockResolvedValue(expected);

    const result = await login("zhangsan@example.com", "123456");

    expect(result).toEqual(expected);
    expect(mockQueryLogin).toHaveBeenCalledWith(
      "zhangsan@example.com",
      "123456",
    );
  });

  it("should propagate errors from queryLogin", async () => {
    mockQueryLogin.mockRejectedValue(new AuthError("账号或密码错误"));

    await expect(login("bad@user.com", "wrong")).rejects.toThrow(AuthError);
  });
});

// ─── Tests: register ──────────────────────────────────────────────────

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate to queryRegister and return result", async () => {
    const input = {
      name: "张三",
      email: "zhangsan@example.com",
      password: "123456",
    };
    const expected = { user: mockUser, token: "jwt-token" };
    mockQueryRegister.mockResolvedValue(expected);

    const result = await register(input);

    expect(result).toEqual(expected);
    expect(mockQueryRegister).toHaveBeenCalledWith(input);
  });

  it("should propagate errors from queryRegister", async () => {
    mockQueryRegister.mockRejectedValue(new Error("邮箱已被注册"));

    await expect(
      register({ name: "张三", email: "taken@test.com", password: "123456" }),
    ).rejects.toThrow("邮箱已被注册");
  });
});

// ─── Tests: logout ────────────────────────────────────────────────────

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear the token cookie", async () => {
    await logout();

    expect(mockCookieStore.set).toHaveBeenCalledWith("token", "", {
      maxAge: 0,
      path: "/",
    });
  });
});

// ─── Tests: getCurrentUser ────────────────────────────────────────────

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when no token cookie exists", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("should return null when token is invalid", async () => {
    mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
    mockVerifyToken.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("should return the user when token is valid and user exists", async () => {
    mockCookieStore.get.mockReturnValue({ value: "valid-token" });
    mockVerifyToken.mockReturnValue({
      userId: "user-1",
      role: "patient",
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getCurrentUser();

    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
      }),
    );
  });

  it("should throw AuthError when token is valid but user is not found in DB", async () => {
    mockCookieStore.get.mockReturnValue({ value: "valid-token" });
    mockVerifyToken.mockReturnValue({
      userId: "nonexistent",
      role: "patient",
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getCurrentUser()).rejects.toThrow(AuthError);
    await expect(getCurrentUser()).rejects.toThrow("用户不存在");
  });
});

// ─── Tests: getPatientProfiles ────────────────────────────────────────

describe("getPatientProfiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate to getPatientProfilesByUser and return result", async () => {
    const expected = [mockProfile];
    mockGetPatientProfilesByUser.mockResolvedValue(expected);

    const result = await getPatientProfiles("user-1");

    expect(result).toEqual(expected);
    expect(mockGetPatientProfilesByUser).toHaveBeenCalledWith("user-1");
  });

  it("should return empty array when user has no profiles", async () => {
    mockGetPatientProfilesByUser.mockResolvedValue([]);

    const result = await getPatientProfiles("user-1");

    expect(result).toEqual([]);
  });
});

// ─── Tests: createPatientProfile ──────────────────────────────────────

describe("createPatientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate to queryCreatePatientProfile and return result", async () => {
    const profileData = {
      name: "张三",
      idCard: "110101199001011234",
      phone: "13800138000",
      gender: "male",
    };
    mockQueryCreatePatientProfile.mockResolvedValue(mockProfile);

    const result = await createPatientProfile("user-1", profileData);

    expect(result).toEqual(mockProfile);
    expect(mockQueryCreatePatientProfile).toHaveBeenCalledWith(
      "user-1",
      profileData,
    );
  });
});

// ─── Tests: updatePatientProfile ──────────────────────────────────────

describe("updatePatientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update and return the patient profile", async () => {
    const updatedProfile = {
      id: "profile-1",
      name: "张三(改)",
      idCard: "110101199001011234",
      phone: "13800138000",
      gender: "male",
    };
    mockPrisma.patientProfile.update.mockResolvedValue(updatedProfile);

    const result = await updatePatientProfile("profile-1", {
      name: "张三(改)",
    });

    expect(result).toEqual({
      id: "profile-1",
      name: "张三(改)",
      idCard: "110101199001011234",
      phone: "13800138000",
      gender: "male",
    });
    expect(mockPrisma.patientProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: { name: "张三(改)" },
      }),
    );
  });

  it("should allow partial update with only provided fields", async () => {
    mockPrisma.patientProfile.update.mockResolvedValue(mockProfile);

    await updatePatientProfile("profile-1", { phone: "13900139000" });

    expect(mockPrisma.patientProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: { phone: "13900139000" },
      }),
    );
  });
});

// ─── Tests: deletePatientProfile ──────────────────────────────────────

describe("deletePatientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a patient profile by id", async () => {
    mockPrisma.patientProfile.delete.mockResolvedValue(mockProfile);

    await deletePatientProfile("profile-1");

    expect(mockPrisma.patientProfile.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
      }),
    );
  });

  it("should propagate prisma errors (e.g., record not found)", async () => {
    mockPrisma.patientProfile.delete.mockRejectedValue(
      new Error("Record to delete does not exist"),
    );

    await expect(
      deletePatientProfile("nonexistent"),
    ).rejects.toThrow("Record to delete does not exist");
  });
});

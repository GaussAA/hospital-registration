import { describe, it, expect, vi, beforeEach } from "vitest";
import { ValidationError, ConflictError, AuthError } from "@/shared/utils/errors";

// Mock DB
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  patientProfile: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};
vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

// Mock password utils
const mockHashPassword = vi.fn();
const mockComparePassword = vi.fn();
vi.mock("@/shared/utils/password", () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

// Mock jwt utils
const mockSignToken = vi.fn();
vi.mock("@/shared/utils/jwt", () => ({
  signToken: mockSignToken,
}));

const { register, login, getPatientProfilesByUser, createPatientProfile } = await import("@/features/auth/queries");

// ─── Fixtures ─────────────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  name: "张三",
  email: "zhangsan@example.com",
  phone: null,
  role: "patient",
  passwordHash: "$2a$10$hashedpassword",
};

const mockUserResponse = {
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
  userId: "user-1",
};

const mockProfileResponse = {
  id: "profile-1",
  name: "张三",
  idCard: "110101199001011234",
  phone: "13800138000",
  gender: "male",
};

// ─── Tests: register ──────────────────────────────────────────────────

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a new user successfully with email", async () => {
    mockHashPassword.mockResolvedValue("hashed-password");
    mockPrisma.user.findUnique.mockResolvedValue(null); // no existing email
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockSignToken.mockReturnValue("jwt-token-123");

    const result = await register({
      name: "张三",
      email: "zhangsan@example.com",
      password: "123456",
    });

    expect(result.user).toEqual(expect.objectContaining(mockUserResponse));
    expect(result.token).toBe("jwt-token-123");
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "张三",
          email: "zhangsan@example.com",
          role: "patient",
        }),
      }),
    );
    expect(mockSignToken).toHaveBeenCalledWith({
      userId: "user-1",
      role: "patient",
    });
  });

  it("should register a new user successfully with phone", async () => {
    mockHashPassword.mockResolvedValue("hashed-password");
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      ...mockUser,
      name: "李四",
      email: null,
      phone: "13800138000",
    });
    mockSignToken.mockReturnValue("jwt-token-456");

    const result = await register({
      name: "李四",
      phone: "13800138000",
      password: "123456",
    });

    expect(result.user.name).toBe("李四");
    expect(result.token).toBe("jwt-token-456");
  });

  it("should throw ValidationError when name is missing", async () => {
    await expect(register({ name: "", email: "test@example.com", password: "123456" })).rejects.toThrow(
      ValidationError,
    );
  });

  it("should throw ValidationError when password is missing", async () => {
    await expect(register({ name: "张三", email: "test@example.com", password: "" })).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when both email and phone are missing", async () => {
    await expect(register({ name: "张三", password: "123456" })).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when password is less than 6 characters", async () => {
    await expect(
      register({
        name: "张三",
        email: "test@example.com",
        password: "12345",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw ConflictError when email already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      register({
        name: "张三",
        email: "zhangsan@example.com",
        password: "123456",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("should throw ConflictError when phone already exists", async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(mockUser); // phone check fails

    await expect(
      register({
        name: "张三",
        phone: "13800138000",
        password: "123456",
      }),
    ).rejects.toThrow(ConflictError);
  });
});

// ─── Tests: login ─────────────────────────────────────────────────────

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should login successfully with email", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockComparePassword.mockResolvedValue(true);
    mockSignToken.mockReturnValue("jwt-token-123");

    const result = await login("zhangsan@example.com", "123456");

    expect(result.user).toEqual(mockUserResponse);
    expect(result.token).toBe("jwt-token-123");
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ email: "zhangsan@example.com" }, { phone: "zhangsan@example.com" }],
        },
      }),
    );
    expect(mockComparePassword).toHaveBeenCalledWith("123456", mockUser.passwordHash);
  });

  it("should login successfully with phone", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockComparePassword.mockResolvedValue(true);
    mockSignToken.mockReturnValue("jwt-token-123");

    const result = await login("13800138000", "123456");

    expect(result.user.name).toBe("张三");
    expect(result.token).toBe("jwt-token-123");
  });

  it("should throw ValidationError when account is empty", async () => {
    await expect(login("", "123456")).rejects.toThrow(ValidationError);
  });

  it("should throw ValidationError when password is empty", async () => {
    await expect(login("zhangsan@example.com", "")).rejects.toThrow(ValidationError);
  });

  it("should throw AuthError when user is not found", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(login("unknown@example.com", "123456")).rejects.toThrow(AuthError);
  });

  it("should throw AuthError when password does not match", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockComparePassword.mockResolvedValue(false);

    await expect(login("zhangsan@example.com", "wrong-password")).rejects.toThrow(AuthError);
  });
});

// ─── Tests: getPatientProfilesByUser ──────────────────────────────────

describe("getPatientProfilesByUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return patient profiles for the given user", async () => {
    mockPrisma.patientProfile.findMany.mockResolvedValue([mockProfile]);

    const result = await getPatientProfilesByUser("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockProfileResponse);
    expect(mockPrisma.patientProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: { name: "asc" },
      }),
    );
  });

  it("should return empty array when user has no profiles", async () => {
    mockPrisma.patientProfile.findMany.mockResolvedValue([]);

    const result = await getPatientProfilesByUser("user-2");

    expect(result).toEqual([]);
  });
});

// ─── Tests: createPatientProfile ──────────────────────────────────────

describe("createPatientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a patient profile successfully", async () => {
    mockPrisma.patientProfile.create.mockResolvedValue(mockProfile);

    const result = await createPatientProfile("user-1", {
      name: "张三",
      idCard: "110101199001011234",
      phone: "13800138000",
      gender: "male",
    });

    expect(result).toEqual(mockProfileResponse);
    expect(mockPrisma.patientProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          name: "张三",
          idCard: "110101199001011234",
          phone: "13800138000",
          gender: "male",
        }),
      }),
    );
  });
});

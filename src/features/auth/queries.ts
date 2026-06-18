import { getPrisma } from "@/shared/db";
import { hashPassword, comparePassword } from "@/shared/utils/password";
import { signToken } from "@/shared/utils/jwt";
import { ConflictError, ValidationError, AuthError } from "@/shared/utils/errors";
import type { UserRole } from "./types";

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
  token: string;
}

export interface RegisterResult {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
  token: string;
}

/**
 * Register a new patient user.
 */
export async function register(data: RegisterData): Promise<RegisterResult> {
  const { name, email, phone, password } = data;

  if (!name || !password || (!email && !phone)) {
    throw new ValidationError("请填写完整信息");
  }
  if (password.length < 6) {
    throw new ValidationError("密码至少 6 位");
  }

  const prisma = await getPrisma();

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError("邮箱已被注册");
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw new ConflictError("手机号已被注册");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "patient" as UserRole },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user, token };
}

/**
 * Login with account (email or phone) and password.
 */
export async function login(
  account: string,
  password: string
): Promise<LoginResult> {
  if (!account || !password) {
    throw new ValidationError("请填写账号和密码");
  }

  const prisma = await getPrisma();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: account }, { phone: account }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AuthError("账号或密码错误");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AuthError("账号或密码错误");
  }

  const token = signToken({ userId: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    token,
  };
}

// ── Patient Profile queries ──

import type { PatientProfileDTO } from "./types";

export async function getPatientProfilesByUser(
  userId: string,
): Promise<PatientProfileDTO[]> {
  const prisma = await getPrisma();

  const profiles = await prisma.patientProfile.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    idCard: p.idCard,
    phone: p.phone,
    gender: p.gender,
  }));
}

export async function createPatientProfile(
  userId: string,
  data: {
    name: string;
    idCard: string;
    phone: string;
    gender: string;
  },
): Promise<PatientProfileDTO> {
  const prisma = await getPrisma();

  const profile = await prisma.patientProfile.create({
    data: {
      userId,
      name: data.name,
      idCard: data.idCard,
      phone: data.phone,
      gender: data.gender,
    },
  });

  return {
    id: profile.id,
    name: profile.name,
    idCard: profile.idCard,
    phone: profile.phone,
    gender: profile.gender,
  };
}

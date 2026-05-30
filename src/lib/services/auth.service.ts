import { getPrisma } from "@/lib/db";
import { hashPassword, comparePassword } from "@/lib/utils/password";
import { signToken } from "@/lib/utils/jwt";
import { ConflictError, ValidationError, AuthError } from "@/lib/utils/errors";
import type { UserRole } from "@/types";

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

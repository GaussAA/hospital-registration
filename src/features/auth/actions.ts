import { cookies } from "next/headers";
import { getPrisma } from "@/shared/db";
import { AuthError } from "@/shared/utils/errors";
import { verifyToken } from "@/shared/utils/jwt";
import {
  register as queryRegister,
  login as queryLogin,
  getPatientProfilesByUser,
  createPatientProfile as queryCreatePatientProfile,
} from "./queries";
import type { UpdateProfileDTO, PatientProfileDTO } from "./types";

// ── Auth Actions ──

export async function login(account: string, password: string) {
  return queryLogin(account, password);
}

export async function register(data: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}) {
  return queryRegister(data);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", { maxAge: 0, path: "/" });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  let payload: { userId: string; role: string };
  try {
    payload = verifyToken(token) as { userId: string; role: string };
  } catch {
    return null;
  }

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!user) throw new AuthError("用户不存在");
  return user;
}

// ── Patient Profile Actions ──

export async function getPatientProfiles(userId: string) {
  return getPatientProfilesByUser(userId);
}

export async function createPatientProfile(
  userId: string,
  data: {
    name: string;
    idCard: string;
    phone: string;
    gender: string;
  },
) {
  return queryCreatePatientProfile(userId, data);
}

export async function updatePatientProfile(
  profileId: string,
  data: UpdateProfileDTO,
): Promise<PatientProfileDTO> {
  const prisma = await getPrisma();

  const profile = await prisma.patientProfile.update({
    where: { id: profileId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.idCard !== undefined && { idCard: data.idCard }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.gender !== undefined && { gender: data.gender }),
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

export async function deletePatientProfile(profileId: string): Promise<void> {
  const prisma = await getPrisma();
  await prisma.patientProfile.delete({
    where: { id: profileId },
  });
}

import { getPrisma } from "@/lib/db";
import type { PatientProfileDTO } from "@/types/dto";

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

import { getPrisma } from "@/lib/db";
import { NotFoundError } from "@/lib/utils/errors";
import type { DoctorDTO } from "@/types/dto";

export interface DoctorDetail {
  id: string;
  name: string;
  title: string;
  specialty: string;
  introduction: string;
  avatarUrl: string;
  departmentId: string;
  departmentName: string;
  hospitalId: string;
  hospitalName: string;
}

export async function listDoctorsByDepartment(
  departmentId: string,
): Promise<DoctorDTO[]> {
  const prisma = await getPrisma();

  // Verify department exists
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    throw new NotFoundError("科室不存在");
  }

  const doctors = await prisma.doctor.findMany({
    where: { departmentId },
    orderBy: { name: "asc" },
  });

  const list: DoctorDTO[] = doctors.map((d) => ({
    id: d.id,
    name: d.name,
    title: d.title,
    specialty: d.specialty,
    introduction: d.introduction,
    avatarUrl: d.avatarUrl,
    departmentId: d.departmentId,
    hospitalId: d.hospitalId,
  }));

  return list;
}

export async function getDoctorById(id: string): Promise<DoctorDetail> {
  const prisma = await getPrisma();

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      department: {
        select: { name: true },
      },
      hospital: {
        select: { name: true },
      },
    },
  });

  if (!doctor) {
    throw new NotFoundError("医生不存在");
  }

  return {
    id: doctor.id,
    name: doctor.name,
    title: doctor.title,
    specialty: doctor.specialty,
    introduction: doctor.introduction,
    avatarUrl: doctor.avatarUrl,
    departmentId: doctor.departmentId,
    departmentName: doctor.department.name,
    hospitalId: doctor.hospitalId,
    hospitalName: doctor.hospital.name,
  };
}

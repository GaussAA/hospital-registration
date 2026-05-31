import { getPrisma } from "@/lib/db";
import { NotFoundError } from "@/lib/utils/errors";

export interface DepartmentListItem {
  id: string;
  name: string;
  description: string;
  hospitalId: string;
  doctorCount: number;
}

export interface DepartmentDetail {
  id: string;
  name: string;
  description: string;
  hospitalId: string;
  hospitalName: string;
  doctorCount: number;
}

export async function listDepartmentsByHospital(
  hospitalId: string,
): Promise<DepartmentListItem[]> {
  const prisma = await getPrisma();

  // Verify hospital exists
  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) {
    throw new NotFoundError("医院不存在");
  }

  const departments = await prisma.department.findMany({
    where: { hospitalId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { doctors: true },
      },
    },
  });

  const list: DepartmentListItem[] = departments.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    hospitalId: d.hospitalId,
    doctorCount: d._count.doctors,
  }));

  return list;
}

export async function getDepartmentById(id: string): Promise<DepartmentDetail> {
  const prisma = await getPrisma();

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      hospital: {
        select: { name: true },
      },
      _count: {
        select: { doctors: true },
      },
    },
  });

  if (!department) {
    throw new NotFoundError("科室不存在");
  }

  return {
    id: department.id,
    name: department.name,
    description: department.description,
    hospitalId: department.hospitalId,
    hospitalName: department.hospital.name,
    doctorCount: department._count.doctors,
  };
}

import { getPrisma } from "@/lib/db";
import { NotFoundError } from "@/lib/utils/errors";
import type { Prisma } from "../../../generated/prisma/client";
import type {
  HospitalDTO,
  HospitalDetailDTO,
  HospitalListParams,
} from "@/types/dto";

export async function listHospitals(
  params: HospitalListParams,
): Promise<{ list: HospitalDTO[]; total: number; page: number; pageSize: number }> {
  const prisma = await getPrisma();
  const { city, level, keyword, page = 1, pageSize = 12 } = params;

  const where: Prisma.HospitalWhereInput = {};

  if (city) {
    where.city = city;
  }
  if (level) {
    where.level = level;
  }
  if (keyword) {
    where.name = { contains: keyword };
  }

  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            departments: true,
            doctors: true,
          },
        },
      },
    }),
    prisma.hospital.count({ where }),
  ]);

  const list: HospitalDTO[] = hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    city: h.city,
    level: h.level,
    phone: h.phone,
    description: h.description,
    imageUrl: h.imageUrl,
    departmentCount: h._count.departments,
    doctorCount: h._count.doctors,
  }));

  return { list, total, page, pageSize };
}

export async function getHospitalById(id: string): Promise<HospitalDetailDTO> {
  const prisma = await getPrisma();

  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          departments: true,
          doctors: true,
        },
      },
    },
  });

  if (!hospital) {
    throw new NotFoundError("医院不存在");
  }

  return {
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    city: hospital.city,
    level: hospital.level,
    phone: hospital.phone,
    description: hospital.description,
    imageUrl: hospital.imageUrl,
    departmentCount: hospital._count.departments,
    doctorCount: hospital._count.doctors,
    createdAt: hospital.createdAt,
  };
}

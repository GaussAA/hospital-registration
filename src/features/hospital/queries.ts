import { getPrisma } from "@/shared/db";
import { NotFoundError } from "@/shared/utils/errors";
import { cacheAside, CACHE_KEYS, CACHE_TTL } from "@/shared/cache";
import type { Prisma } from "@generated/prisma/client";
import type {
  HospitalDTO,
  HospitalDetailDTO,
  HospitalListParams,
  DoctorDTO,
} from "./types";
import { format, addDays } from "date-fns";
import type { ScheduleSlotData } from "./types";

// ==================== Hospital ====================

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
  return cacheAside(
    CACHE_KEYS.HOSPITAL_DETAIL(id),
    CACHE_TTL.HOSPITAL_DETAIL,
    async () => {
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
    },
  );
}

// ==================== Department ====================

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
  return cacheAside(
    CACHE_KEYS.DEPARTMENTS_BY_HOSPITAL(hospitalId),
    CACHE_TTL.DEPARTMENTS,
    async () => {
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
    },
  );
}

export async function getDepartmentById(id: string): Promise<DepartmentDetail> {
  return cacheAside(
    CACHE_KEYS.DEPARTMENT_DETAIL(id),
    CACHE_TTL.DEPARTMENTS,
    async () => {
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
    },
  );
}

// ==================== Doctor ====================

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
  return cacheAside(
    CACHE_KEYS.DOCTORS_BY_DEPARTMENT(departmentId),
    CACHE_TTL.DOCTORS,
    async () => {
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
    },
  );
}

export async function getDoctorById(id: string): Promise<DoctorDetail> {
  return cacheAside(
    CACHE_KEYS.DOCTOR_DETAIL(id),
    CACHE_TTL.DOCTOR_DETAIL,
    async () => {
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
    },
  );
}

// ==================== Schedule ====================

export async function listSchedulesByDoctor(doctorId: string): Promise<ScheduleSlotData[]> {
  return cacheAside(
    CACHE_KEYS.SCHEDULES_BY_DOCTOR(doctorId),
    CACHE_TTL.SCHEDULES,
    async () => {
      const prisma = await getPrisma();

      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        dates.push(format(addDays(today, i), "yyyy-MM-dd"));
      }

      const schedules = await prisma.schedule.findMany({
        where: {
          doctorId,
          date: { in: dates },
        },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }, { type: "asc" }],
      });

      return schedules.map((s) => ({
        id: s.id,
        doctorId: s.doctorId,
        date: s.date,
        timeSlot: s.timeSlot as "am" | "pm" | "evening",
        type: s.type,
        quota: s.quota,
        bookedCount: s.bookedCount,
        remaining: s.quota - s.bookedCount,
      }));
    },
  );
}

"use server";

import { getPrisma } from "@/shared/db";
import { NotFoundError } from "@/shared/utils/errors";
import { revalidatePath } from "next/cache";
import {
  listHospitals,
  getHospitalById,
  listDepartmentsByHospital,
  getDepartmentById,
  listDoctorsByDepartment,
  getDoctorById,
  listSchedulesByDoctor,
} from "./queries";
import type {
  HospitalDTO,
  HospitalDetailDTO,
  DepartmentDTO,
  DoctorDTO,
  ScheduleDTO,
  CreateHospitalDTO,
  CreateDepartmentDTO,
  CreateDoctorDTO,
  CreateScheduleDTO,
} from "./types";

// ==================== Public Queries ====================

export async function searchHospitals(params: {
  city?: string;
  level?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ list: HospitalDTO[]; total: number; page: number; pageSize: number }> {
  return listHospitals(params);
}

export async function getHospitalDetail(id: string): Promise<HospitalDetailDTO> {
  return getHospitalById(id);
}

export async function listDepartments(hospitalId: string) {
  return listDepartmentsByHospital(hospitalId);
}

export async function getDepartmentDetail(id: string) {
  return getDepartmentById(id);
}

export async function listDoctors(departmentId: string): Promise<DoctorDTO[]> {
  return listDoctorsByDepartment(departmentId);
}

export async function getDoctorDetail(id: string) {
  return getDoctorById(id);
}

export async function getDoctorSchedules(doctorId: string) {
  return listSchedulesByDoctor(doctorId);
}

// ==================== Admin CRUD: Hospital ====================

export async function createHospital(data: CreateHospitalDTO) {
  const prisma = await getPrisma();
  const hospital = await prisma.hospital.create({ data });
  revalidatePath("/admin/hospitals");
  return hospital;
}

export async function updateHospital(id: string, data: Partial<CreateHospitalDTO>) {
  const prisma = await getPrisma();
  const existing = await prisma.hospital.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("医院不存在");
  const hospital = await prisma.hospital.update({ where: { id }, data });
  revalidatePath("/admin/hospitals");
  revalidatePath(`/hospitals/${id}`);
  return hospital;
}

export async function deleteHospital(id: string) {
  const prisma = await getPrisma();
  const existing = await prisma.hospital.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("医院不存在");
  await prisma.hospital.delete({ where: { id } });
  revalidatePath("/admin/hospitals");
}

// ==================== Admin CRUD: Department ====================

export async function createDepartment(data: CreateDepartmentDTO) {
  const prisma = await getPrisma();
  const department = await prisma.department.create({ data });
  revalidatePath("/admin/departments");
  revalidatePath(`/hospitals/${data.hospitalId}`);
  return department;
}

export async function updateDepartment(id: string, data: Partial<CreateDepartmentDTO>) {
  const prisma = await getPrisma();
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("科室不存在");
  const department = await prisma.department.update({ where: { id }, data });
  revalidatePath("/admin/departments");
  revalidatePath(`/hospitals/${existing.hospitalId}`);
  return department;
}

export async function deleteDepartment(id: string) {
  const prisma = await getPrisma();
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("科室不存在");
  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
  revalidatePath(`/hospitals/${existing.hospitalId}`);
}

// ==================== Admin CRUD: Doctor ====================

export async function createDoctor(data: CreateDoctorDTO) {
  const prisma = await getPrisma();
  const doctor = await prisma.doctor.create({ data });
  revalidatePath("/admin/doctors");
  revalidatePath(`/hospitals/${data.hospitalId}/departments/${data.departmentId}`);
  return doctor;
}

export async function updateDoctor(id: string, data: Partial<CreateDoctorDTO>) {
  const prisma = await getPrisma();
  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("医生不存在");
  const doctor = await prisma.doctor.update({ where: { id }, data });
  revalidatePath("/admin/doctors");
  return doctor;
}

export async function deleteDoctor(id: string) {
  const prisma = await getPrisma();
  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("医生不存在");
  await prisma.doctor.delete({ where: { id } });
  revalidatePath("/admin/doctors");
}

// ==================== Admin CRUD: Schedule ====================

export async function createSchedule(data: CreateScheduleDTO) {
  const prisma = await getPrisma();
  const schedule = await prisma.schedule.create({ data: { ...data, bookedCount: 0 } });
  revalidatePath("/admin/schedules");
  return schedule;
}

export async function updateSchedule(id: string, data: Partial<CreateScheduleDTO>) {
  const prisma = await getPrisma();
  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("排班不存在");
  const schedule = await prisma.schedule.update({ where: { id }, data });
  revalidatePath("/admin/schedules");
  return schedule;
}

export async function deleteSchedule(id: string) {
  const prisma = await getPrisma();
  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("排班不存在");
  await prisma.schedule.delete({ where: { id } });
  revalidatePath("/admin/schedules");
}

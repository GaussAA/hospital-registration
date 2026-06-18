import { getPrisma } from "@/shared/db";
import type { DashboardStats, OverviewData } from "./types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const prisma = await getPrisma();

  const [
    hospitalCount,
    departmentCount,
    doctorCount,
    registrationCount,
    todayRegistrationCount,
    pendingCount,
    userCount,
  ] = await Promise.all([
    prisma.hospital.count(),
    prisma.department.count(),
    prisma.doctor.count(),
    prisma.registration.count(),
    prisma.registration.count({
      where: { date: new Date().toISOString().split("T")[0] },
    }),
    prisma.registration.count({
      where: { status: "pending" },
    }),
    prisma.user.count(),
  ]);

  return {
    hospitalCount,
    departmentCount,
    doctorCount,
    registrationCount,
    todayRegistrationCount,
    pendingCount,
    userCount,
  };
}

export async function getAdminOverview(): Promise<OverviewData> {
  const prisma = await getPrisma();

  const [stats, registrations] = await Promise.all([
    getDashboardStats(),
    prisma.registration.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true } },
        doctor: {
          select: {
            name: true,
            hospital: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    stats,
    recentRegistrations: registrations.map((r) => ({
      id: r.id,
      patientName: r.patient.name,
      doctorName: r.doctor.name,
      hospitalName: r.doctor.hospital.name,
      date: r.date,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

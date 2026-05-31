import { getPrisma } from "@/lib/db";
import { NotFoundError, ConflictError } from "@/lib/utils/errors";
import type { Prisma } from "../../../generated/prisma/client";
import type { RegistrationStatus } from "@/types/index";
import type { RegistrationDTO } from "@/types/dto";

/**
 * Create a new registration (appointment) within a transaction.
 * Handles optimistic locking on bookedCount to prevent overselling.
 */
export async function createRegistration(
  patientId: string,
  scheduleId: string,
  profileId: string,
  type: "normal" | "expert" | "special"
) {
  const prisma = await getPrisma();

  return prisma.$transaction(async (tx) => {
    // 1. Fetch schedule info
    const schedule = await tx.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundError("排班不存在");
    if (schedule.bookedCount >= schedule.quota) {
      throw new ConflictError("号源已满");
    }

    // 2. Check same patient on same date + timeSlot (prevent duplicate booking)
    const existing = await tx.registration.findFirst({
      where: {
        patientId,
        date: schedule.date,
        timeSlot: schedule.timeSlot,
        status: { not: "cancelled" },
      },
    });
    if (existing) {
      throw new ConflictError("该时段已存在挂号记录");
    }

    // 3. Optimistic lock — atomically increment if not full
    const result = await tx.schedule.updateMany({
      where: {
        id: scheduleId,
        bookedCount: { lt: schedule.quota },
      },
      data: { bookedCount: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new ConflictError("号源已被抢完");
    }

    // 4. Create registration record
    const registration = await tx.registration.create({
      data: {
        patientId,
        profileId,
        doctorId: schedule.doctorId,
        scheduleId,
        date: schedule.date,
        timeSlot: schedule.timeSlot,
        type,
        status: "pending",
      },
      include: {
        doctor: {
          include: {
            department: true,
            hospital: true,
          },
        },
        profile: true,
      },
    });

    return registration;
  });
}

/**
 * List registrations for a patient, with optional status filter and pagination.
 */
export async function listRegistrations(
  patientId: string,
  status?: RegistrationStatus,
  page: number = 1,
  pageSize: number = 10
) {
  const prisma = await getPrisma();

  const where: Prisma.RegistrationWhereInput = { patientId };
  if (status) {
    where.status = status;
  }

  const [list, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        doctor: {
          include: {
            department: true,
            hospital: true,
          },
        },
        profile: true,
      },
    }),
    prisma.registration.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

/**
 * Get a single registration by ID, including doctor and profile info.
 */
export async function getRegistrationById(id: string) {
  const prisma = await getPrisma();

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      doctor: {
        include: {
          department: true,
          hospital: true,
        },
      },
      profile: true,
    },
  });

  if (!registration) throw new NotFoundError("挂号记录不存在");

  return registration;
}

/**
 * Cancel a registration (only if status is "pending").
 * Uses a transaction to decrement bookedCount and update status.
 */
export async function cancelRegistration(id: string, patientId: string) {
  const prisma = await getPrisma();

  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!registration) throw new NotFoundError("挂号记录不存在");
    if (registration.patientId !== patientId) {
      throw new NotFoundError("挂号记录不存在");
    }
    if (registration.status !== "pending") {
      throw new ConflictError("当前状态不可取消");
    }

    // Decrement the schedule's bookedCount
    await tx.schedule.update({
      where: { id: registration.scheduleId },
      data: { bookedCount: { decrement: 1 } },
    });

    // Update registration status
    const updated = await tx.registration.update({
      where: { id },
      data: { status: "cancelled" },
      include: {
        doctor: {
          include: {
            department: true,
            hospital: true,
          },
        },
        profile: true,
      },
    });

    return updated;
  });
}

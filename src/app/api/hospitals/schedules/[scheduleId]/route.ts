import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { NotFoundError } from "@/lib/utils/errors";
import { getPrisma } from "@/lib/db";

export const GET = apiHandler<{ scheduleId: string }>(async (req, { params }) => {
  const { scheduleId } = await params;
  const prisma = await getPrisma();

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      doctor: {
        include: {
          department: true,
          hospital: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new NotFoundError("排班不存在");
  }

  return NextResponse.json(
    success({
      schedule: {
        id: schedule.id,
        date: schedule.date,
        timeSlot: schedule.timeSlot,
        type: schedule.type,
        quota: schedule.quota,
        bookedCount: schedule.bookedCount,
        remaining: schedule.quota - schedule.bookedCount,
        doctor: {
          id: schedule.doctor.id,
          name: schedule.doctor.name,
          title: schedule.doctor.title,
          department: { name: schedule.doctor.department.name },
          hospital: { name: schedule.doctor.hospital.name },
        },
      },
    })
  );
});

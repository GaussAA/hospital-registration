import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success, fail } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await props.params;
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
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(fail(40400, error.message), { status: 404 });
    }
    console.error("Get schedule error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}

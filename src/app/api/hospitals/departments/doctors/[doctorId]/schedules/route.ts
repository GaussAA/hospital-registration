import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { listSchedulesByDoctor } from "@/lib/services/schedule.service";

export const GET = apiHandler<{ doctorId: string }>(async (req, { params }) => {
  const { doctorId } = await params;
  const schedules = await listSchedulesByDoctor(doctorId);
  return NextResponse.json(success(schedules));
});

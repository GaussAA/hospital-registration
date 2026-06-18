import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { listSchedulesByDoctor } from "@/features/hospital/queries";

export const GET = apiHandler<{ doctorId: string }>(async (req, { params }) => {
  const { doctorId } = await params;
  const schedules = await listSchedulesByDoctor(doctorId);
  return NextResponse.json(success(schedules));
});

import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { getDoctorById } from "@/lib/services/doctor.service";

export const GET = apiHandler<{ doctorId: string }>(async (req, { params }) => {
  const { doctorId } = await params;
  const doctor = await getDoctorById(doctorId);
  return NextResponse.json(success(doctor));
});

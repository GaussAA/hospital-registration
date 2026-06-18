import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
// eslint-disable-next-line no-restricted-imports
import { getDoctorById } from "@/features/hospital/queries";

export const GET = apiHandler<{ doctorId: string }>(async (req, { params }) => {
  const { doctorId } = await params;
  const doctor = await getDoctorById(doctorId);
  return NextResponse.json(success(doctor));
});

import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { listDoctorsByDepartment } from "@/lib/services/doctor.service";

export const GET = apiHandler<{ departmentId: string }>(async (req, { params }) => {
  const { departmentId } = await params;
  const doctors = await listDoctorsByDepartment(departmentId);
  return NextResponse.json(success(doctors));
});

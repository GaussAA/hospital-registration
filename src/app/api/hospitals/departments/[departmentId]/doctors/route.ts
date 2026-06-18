import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { listDoctorsByDepartment } from "@/features/hospital";

export const GET = apiHandler<{ departmentId: string }>(async (req, { params }) => {
  const { departmentId } = await params;
  const doctors = await listDoctorsByDepartment(departmentId);
  return NextResponse.json(success(doctors));
});

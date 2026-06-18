import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { listDepartmentsByHospital } from "@/features/hospital";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;
  const departments = await listDepartmentsByHospital(hospitalId);
  return NextResponse.json(success(departments));
});

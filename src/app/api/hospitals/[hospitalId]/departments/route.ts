import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { listDepartmentsByHospital } from "@/lib/services/department.service";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;
  const departments = await listDepartmentsByHospital(hospitalId);
  return NextResponse.json(success(departments));
});

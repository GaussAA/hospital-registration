import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
// eslint-disable-next-line no-restricted-imports
import { listDepartmentsByHospital } from "@/features/hospital/queries";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;
  const departments = await listDepartmentsByHospital(hospitalId);
  return NextResponse.json(success(departments));
});

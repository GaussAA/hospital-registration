import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
// eslint-disable-next-line no-restricted-imports
import { getDepartmentById } from "@/features/hospital/queries";

export const GET = apiHandler<{ departmentId: string }>(async (req, { params }) => {
  const { departmentId } = await params;
  const department = await getDepartmentById(departmentId);
  return NextResponse.json(success(department));
});

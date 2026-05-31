import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { getDepartmentById } from "@/lib/services/department.service";

export const GET = apiHandler<{ departmentId: string }>(async (req, { params }) => {
  const { departmentId } = await params;
  const department = await getDepartmentById(departmentId);
  return NextResponse.json(success(department));
});

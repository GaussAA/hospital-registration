import { NextResponse } from "next/server";
import { success, fail } from "@/lib/utils/response";
import { listDepartmentsByHospital } from "@/lib/services/department.service";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _request: Request,
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await props.params;
    const departments = await listDepartmentsByHospital(hospitalId);
    return NextResponse.json(success(departments));
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(fail(404, error.message), { status: 404 });
    }
    if (error instanceof Error) {
      return NextResponse.json(fail(400, error.message), { status: 400 });
    }
    return NextResponse.json(fail(500, "服务器内部错误"), { status: 500 });
  }
}

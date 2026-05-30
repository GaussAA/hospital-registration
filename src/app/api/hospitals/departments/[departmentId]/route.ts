import { NextResponse } from "next/server";
import { success, fail } from "@/lib/utils/response";
import { getDepartmentById } from "@/lib/services/department.service";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _request: Request,
  props: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await props.params;
    const department = await getDepartmentById(departmentId);
    return NextResponse.json(success(department));
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

import { NextRequest, NextResponse } from "next/server";
import { success, fail } from "@/lib/utils/response";
import { listHospitals } from "@/lib/services/hospital.service";
import { listHospitalsSchema } from "@/lib/validations/hospital.schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = listHospitalsSchema.parse({
      city: searchParams.get("city") || undefined,
      level: searchParams.get("level") || undefined,
      keyword: searchParams.get("keyword") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 12,
    });

    const result = await listHospitals(params);
    return NextResponse.json(success(result));
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(fail(400, error.message), { status: 400 });
    }
    return NextResponse.json(fail(500, "服务器内部错误"), { status: 500 });
  }
}

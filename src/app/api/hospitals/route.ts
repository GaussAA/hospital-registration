import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { ValidationError } from "@/lib/utils/errors";
import { listHospitals } from "@/lib/services/hospital.service";
import { listHospitalsSchema } from "@/lib/validations/hospital.schema";

export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const parsed = listHospitalsSchema.safeParse({
    city: searchParams.get("city") || undefined,
    level: searchParams.get("level") || undefined,
    keyword: searchParams.get("keyword") || undefined,
    page: searchParams.get("page") || 1,
    pageSize: searchParams.get("pageSize") || 12,
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "参数验证失败");
  }

  const result = await listHospitals(parsed.data);
  return NextResponse.json(success(result));
});

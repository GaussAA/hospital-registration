import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { ValidationError } from "@/shared/utils/errors";
// eslint-disable-next-line no-restricted-imports
import { listHospitals } from "@/features/hospital/queries";
// eslint-disable-next-line no-restricted-imports
import { listHospitalsSchema } from "@/features/hospital/validations";

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

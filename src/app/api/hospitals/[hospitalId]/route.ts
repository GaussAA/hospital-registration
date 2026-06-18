import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { getHospitalById } from "@/features/hospital";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;
  const hospital = await getHospitalById(hospitalId);
  return NextResponse.json(success(hospital));
});

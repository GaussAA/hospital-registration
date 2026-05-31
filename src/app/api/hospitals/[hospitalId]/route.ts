import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { getHospitalById } from "@/lib/services/hospital.service";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;
  const hospital = await getHospitalById(hospitalId);
  return NextResponse.json(success(hospital));
});

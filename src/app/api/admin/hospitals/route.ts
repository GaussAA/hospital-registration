import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { ValidationError } from "@/shared/utils/errors";
// eslint-disable-next-line no-restricted-imports
import { listHospitals } from "@/features/hospital/queries";

export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");

  const result = await listHospitals({ page, pageSize });
  return NextResponse.json(success(result));
}, { requireAdmin: true });

export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const { name, city, level, phone, address, description } = body;

  if (!name || !city || !phone || !address) {
    throw new ValidationError("缺少必要字段");
  }

  const prisma = await getPrisma();

  const hospital = await prisma.hospital.create({
    data: {
      name,
      city,
      level: level || "三甲",
      phone,
      address,
      description: description || "",
    },
  });

  return NextResponse.json(success(hospital), { status: 201 });
}, { requireAdmin: true });

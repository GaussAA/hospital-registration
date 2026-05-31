import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { ValidationError } from "@/lib/utils/errors";
import { paginationSchema } from "@/lib/validations/common.schema";

export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => { raw[key] = value; });
  const query = paginationSchema.parse(raw);

  const prisma = await getPrisma();

  const [list, total] = await Promise.all([
    prisma.hospital.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.hospital.count(),
  ]);

  return NextResponse.json(success({ list, total, page: query.page, pageSize: query.pageSize }));
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

import { NextResponse } from "next/server";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const prisma = await getPrisma();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [totalHospitals, totalDoctors, totalDepartments, todayAppointments] =
    await Promise.all([
      prisma.hospital.count(),
      prisma.doctor.count(),
      prisma.department.count(),
      prisma.registration.count({
        where: { date: todayStr },
      }),
    ]);

  return NextResponse.json(
    success({ totalHospitals, totalDoctors, totalDepartments, todayAppointments })
  );
});

import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";

export const GET = apiHandler(async () => {
  const prisma = await getPrisma();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [todayAppointments, totalHospitals, totalDoctors] =
    await Promise.all([
      prisma.registration.count({
        where: { date: todayStr },
      }),
      prisma.hospital.count(),
      prisma.doctor.count(),
    ]);

  return NextResponse.json(
    success({ todayAppointments, totalHospitals, totalDoctors })
  );
}, { requireAdmin: true });

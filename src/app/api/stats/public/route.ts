import { NextResponse } from "next/server";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { getPrisma } from "@/shared/db";
import { cacheAside, CACHE_KEYS, CACHE_TTL } from "@/shared/cache";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const stats = await cacheAside(
    CACHE_KEYS.PUBLIC_STATS,
    CACHE_TTL.PUBLIC_STATS,
    async () => {
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

      return { totalHospitals, totalDoctors, totalDepartments, todayAppointments };
    },
  );

  return NextResponse.json(success(stats));
});

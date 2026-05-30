import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch {
    return NextResponse.json(
      success({ totalHospitals: 0, totalDoctors: 0, totalDepartments: 0, todayAppointments: 0 })
    );
  }
}

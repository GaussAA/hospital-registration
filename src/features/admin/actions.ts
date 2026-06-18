"use server";

import {
  createHospital,
  updateHospital,
  deleteHospital,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/features/hospital";
import {
  getCurrentUser,
} from "@/features/auth";
import {
  listRegistrations,
} from "@/features/registration";

// Re-export CRUD actions from feature modules
export {
  createHospital,
  updateHospital,
  deleteHospital,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};

// Auth - list all users (admin only)
export async function listUsers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("无权访问");
  }
  const { getPrisma } = await import("@/shared/db");
  const prisma = await getPrisma();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Export registration list for admin
export { listRegistrations };

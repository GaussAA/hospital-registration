"use server";

import { revalidatePath } from "next/cache";
import {
  createRegistration as createRegistrationQuery,
  listRegistrations as listRegistrationsQuery,
  getRegistrationById as getRegistrationByIdQuery,
  cancelRegistration as cancelRegistrationQuery,
} from "./queries";
import type { CreateRegistrationDTO, RegistrationFilterDTO } from "./types";

// ==================== Public Queries ====================

export async function createRegistration(
  patientId: string,
  data: CreateRegistrationDTO,
) {
  const result = await createRegistrationQuery(
    patientId,
    data.scheduleId,
    data.profileId,
    data.type,
  );
  revalidatePath("/appointments");
  return result;
}

export async function listRegistrations(
  filter: RegistrationFilterDTO,
) {
  return listRegistrationsQuery(
    filter.patientId!,
    filter.status,
    filter.page,
    filter.pageSize,
  );
}

export async function getRegistrationById(id: string) {
  return getRegistrationByIdQuery(id);
}

export async function cancelRegistration(id: string, patientId: string) {
  const result = await cancelRegistrationQuery(id, patientId);
  revalidatePath("/appointments");
  return result;
}

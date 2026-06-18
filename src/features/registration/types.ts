// ==================== Common Enums ====================

export type RegistrationStatus = "pending" | "done" | "cancelled";

export type TimeSlot = "am" | "pm" | "evening";

export type ScheduleType = "normal" | "expert" | "special";

// ==================== DTOs ====================

export interface RegistrationDTO {
  id: string;
  patientId: string;
  profileId: string;
  doctorId: string;
  scheduleId: string;
  date: string;
  timeSlot: string;
  type: string;
  status: string;
  createdAt: string;
}

// ==================== Create DTOs ====================

export interface CreateRegistrationDTO {
  scheduleId: string;
  profileId: string;
  type: ScheduleType;
}

// ==================== Filter DTOs ====================

export interface RegistrationFilterDTO {
  status?: RegistrationStatus;
  patientId?: string;
  page?: number;
  pageSize?: number;
}

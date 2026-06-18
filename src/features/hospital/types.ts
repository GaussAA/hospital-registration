// ==================== Common Enums ====================

export type TimeSlot = "am" | "pm" | "evening";

export type ScheduleType = "normal" | "expert" | "special";

export type DoctorTitle =
  | "主任医师"
  | "副主任医师"
  | "主治医师"
  | "住院医师"
  | "医士";

// ==================== DTOs ====================

export interface HospitalDTO {
  id: string;
  name: string;
  address: string;
  city: string;
  level: string;
  phone: string;
  description: string;
  imageUrl: string;
  departmentCount: number;
  doctorCount: number;
}

export interface HospitalDetailDTO extends HospitalDTO {
  createdAt: Date;
}

export interface DepartmentDTO {
  id: string;
  name: string;
  description: string;
  hospitalId: string;
}

export interface DoctorDTO {
  id: string;
  name: string;
  title: string;
  specialty: string;
  introduction: string;
  avatarUrl: string;
  departmentId: string;
  hospitalId: string;
}

export interface ScheduleDTO {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  quota: number;
  bookedCount: number;
  remaining: number;
  type: string;
}

// ==================== Create DTOs ====================

export interface CreateHospitalDTO {
  name: string;
  address: string;
  city: string;
  level: string;
  phone: string;
  description?: string;
  imageUrl?: string;
}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  hospitalId: string;
}

export interface CreateDoctorDTO {
  name: string;
  title: string;
  specialty: string;
  introduction?: string;
  avatarUrl?: string;
  departmentId: string;
  hospitalId: string;
}

export interface CreateScheduleDTO {
  doctorId: string;
  date: string;
  timeSlot: TimeSlot;
  type: string;
  quota: number;
}

// ==================== Filter DTOs ====================

export interface HospitalFilterDTO {
  city?: string;
  level?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface DepartmentFilterDTO {
  hospitalId?: string;
}

export interface DoctorFilterDTO {
  departmentId?: string;
  title?: string;
}

// ==================== Query Params ====================

export interface HospitalListParams {
  city?: string;
  level?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// ==================== Schedule Data ====================

export interface ScheduleSlotData {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: "am" | "pm" | "evening";
  type: string;
  quota: number;
  bookedCount: number;
  remaining: number;
}

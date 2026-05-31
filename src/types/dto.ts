// 医院 DTO
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

// 科室 DTO
export interface DepartmentDTO {
  id: string;
  name: string;
  description: string;
  hospitalId: string;
}

// 医生 DTO
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

// 排班 DTO
export interface ScheduleSlotDTO {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  quota: number;
  bookedCount: number;
  remaining: number;
  type: string;
}

// 挂号 DTO
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

// 就诊人 DTO
export interface PatientProfileDTO {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  gender: string;
}

// 医院查询参数
export interface HospitalListParams {
  city?: string;
  level?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

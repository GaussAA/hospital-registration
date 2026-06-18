// Components
export { default as HospitalCard } from "./components/HospitalCard";
export { default as HospitalFilter } from "./components/HospitalFilter";
export { default as HospitalInfo } from "./components/HospitalInfo";
export { default as HospitalSearch } from "./components/HospitalSearch";
export { default as Pagination } from "./components/Pagination";
export { default as DepartmentCard } from "./components/DepartmentCard";
export { default as DepartmentList } from "./components/DepartmentList";
export { default as DoctorCard } from "./components/DoctorCard";
export { default as DoctorInfo } from "./components/DoctorInfo";
export { default as ScheduleCalendar } from "./components/ScheduleCalendar";

// Actions
export {
  searchHospitals,
  getHospitalDetail,
  listDepartments,
  getDepartmentDetail,
  listDoctors,
  getDoctorDetail,
  getDoctorSchedules,
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
} from "./actions";

// Query functions (for programmatic use by other modules)
export {
  listHospitals,
  getHospitalById,
  listDepartmentsByHospital,
  getDepartmentById,
  listDoctorsByDepartment,
  getDoctorById,
  listSchedulesByDoctor,
} from "./queries";

// Validations
export { listHospitalsSchema, departmentIdSchema, doctorIdSchema } from "./validations";

// Types
export type {
  HospitalDTO,
  HospitalDetailDTO,
  DepartmentDTO,
  DoctorDTO,
  ScheduleDTO,
  CreateHospitalDTO,
  CreateDepartmentDTO,
  CreateDoctorDTO,
  CreateScheduleDTO,
  HospitalFilterDTO,
  DoctorFilterDTO,
  DepartmentFilterDTO,
  TimeSlot,
  ScheduleType,
  DoctorTitle,
  HospitalListParams,
  ScheduleSlotData,
} from "./types";

// Components
export { default as DataTable } from "./components/DataTable";
export type { Column, ColumnValue, DataTableProps } from "./components/DataTable";
export { default as HospitalForm } from "./components/HospitalForm";
export type { HospitalFormData } from "./components/HospitalForm";
export { default as DepartmentForm } from "./components/DepartmentForm";
export type { DepartmentFormData } from "./components/DepartmentForm";
export { default as DoctorForm } from "./components/DoctorForm";
export type { DoctorFormData } from "./components/DoctorForm";
export { default as ScheduleForm } from "./components/ScheduleForm";
export type { ScheduleFormData } from "./components/ScheduleForm";
export { default as AdminHeader } from "./components/AdminHeader";
export { default as AdminSidebar } from "./components/AdminSidebar";

// Actions
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
  listUsers,
  listRegistrations,
} from "./actions";

// Types
export type {
  DashboardStats,
  AdminMenuItem,
  OverviewData,
} from "./types";

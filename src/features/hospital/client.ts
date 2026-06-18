// ── Client-side sub-barrel ──────────────────────────────────────────────
// 仅导出客户端安全的内容（组件），避免将服务端 actions/queries 拖入 client bundle

export { default as HospitalCard } from "./components/HospitalCard";
export type { HospitalCardData } from "./components/HospitalCard";
export { default as HospitalFilter } from "./components/HospitalFilter";
export { default as HospitalSearch } from "./components/HospitalSearch";
export { default as Pagination } from "./components/Pagination";
export { default as DepartmentCard } from "./components/DepartmentCard";
export type { DepartmentCardData } from "./components/DepartmentCard";
export { default as DepartmentList } from "./components/DepartmentList";
export { default as DoctorCard } from "./components/DoctorCard";
export type { DoctorCardData } from "./components/DoctorCard";
export { default as DoctorInfo } from "./components/DoctorInfo";
export type { DoctorInfoData } from "./components/DoctorInfo";
export { default as ScheduleCalendar } from "./components/ScheduleCalendar";
export type { ScheduleSlot } from "./components/ScheduleCalendar";

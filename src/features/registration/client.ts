// ── Client-side sub-barrel ──────────────────────────────────────────────
// 仅导出客户端安全的内容（组件），避免将服务端 actions/queries 拖入 client bundle

export { default as AppointmentList } from "./components/AppointmentList";
export { default as ConfirmCard } from "./components/ConfirmCard";
export { default as PatientForm } from "./components/PatientForm";
export { default as PatientSelector } from "./components/PatientSelector";
export type { PatientProfile } from "./components/PatientSelector";
export { default as SlotSelector } from "./components/SlotSelector";
export { default as SlotSelectorDesktop } from "./components/SlotSelectorDesktop";
export { default as SlotSelectorMobile } from "./components/SlotSelectorMobile";
export { default as SuccessCard } from "./components/SuccessCard";

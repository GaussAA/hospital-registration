"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ScheduleCalendar from "@/components/doctor/ScheduleCalendar";
import type { ScheduleSlot } from "@/components/doctor/ScheduleCalendar";
import PatientSelector from "@/components/appointment/PatientSelector";
import type { PatientProfile } from "@/components/appointment/PatientSelector";
import ConfirmCard from "@/components/appointment/ConfirmCard";

interface ScheduleCalendarWrapperProps {
  schedules: ScheduleSlot[];
  doctorId: string;
  hospitalId: string;
  departmentId: string;
  doctorName: string;
  doctorTitle: string;
  departmentName: string;
  hospitalName: string;
}

/**
 * ScheduleCalendarWrapper — orchestrates the full registration flow inline.
 *
 * State machine:
 *   idle → slot clicked → profile_selection → confirm → submit → navigate to success
 */
export default function ScheduleCalendarWrapper({
  schedules,
  doctorId,
  hospitalId,
  departmentId,
  doctorName,
  doctorTitle,
  departmentName,
  hospitalName,
}: ScheduleCalendarWrapperProps) {
  const router = useRouter();

  // Booking state
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [step, setStep] = useState<"idle" | "profile" | "confirm">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /** Handle slot click from the calendar */
  const handleSlotSelect = useCallback(
    (slot: ScheduleSlot) => {
      setSelectedSlot(slot);
      setSelectedProfile(null);
      setError("");
      setStep("profile");
      // Scroll down to the booking panel
      setTimeout(() => {
        document.getElementById("booking-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    [],
  );

  /** Handle profile selection → move to confirm */
  const handleProfileSelect = useCallback((profile: PatientProfile) => {
    setSelectedProfile(profile);
    setError("");
    setStep("confirm");
  }, []);

  /** Submit the appointment */
  const handleSubmit = useCallback(async () => {
    if (!selectedSlot || !selectedProfile) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selectedSlot.id,
          profileId: selectedProfile.id,
          type: selectedSlot.type,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "挂号失败，请重试");
        setSubmitting(false);
        return;
      }

      router.refresh();
      const regId = json.data?.registration?.id;
      if (regId) {
        router.push(`/appointments/success?id=${regId}`);
      } else {
        router.push("/appointments");
      }
    } catch {
      setError("网络错误，请稍后重试");
      setSubmitting(false);
    }
  }, [selectedSlot, selectedProfile, router]);

  /** Reset back to idle */
  const handleCancel = useCallback(() => {
    setStep("idle");
    setSelectedSlot(null);
    setSelectedProfile(null);
    setError("");
  }, []);

  const timeSlotLabels: Record<string, string> = {
    am: "上午", pm: "下午", evening: "晚间",
  };
  const typeLabels: Record<string, string> = {
    normal: "普通号", expert: "专家号", special: "特需号",
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <ScheduleCalendar
        schedules={schedules}
        doctorId={doctorId}
        selectedSlotId={selectedSlot?.id}
        onSlotSelect={handleSlotSelect}
      />

      {/* Booking panel — appears when a slot is selected */}
      {step !== "idle" && selectedSlot && (
        <div id="booking-panel" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold">
                {step === "profile" ? "1" : "2"}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {step === "profile" ? "选择就诊人" : "确认挂号"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {doctorName} · {typeLabels[selectedSlot.type] ?? selectedSlot.type} ·
                  {formatDate(selectedSlot.date)} {timeSlotLabels[selectedSlot.timeSlot] ?? selectedSlot.timeSlot}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step: Profile selection */}
          {step === "profile" && (
            <div className="p-5">
              <PatientSelector
                selectedId={selectedProfile?.id}
                onSelect={handleProfileSelect}
              />
            </div>
          )}

          {/* Step: Confirm + Submit */}
          {step === "confirm" && selectedProfile && (
            <div className="p-5 space-y-4">
              <ConfirmCard
                doctorName={doctorName}
                doctorTitle={doctorTitle}
                departmentName={departmentName}
                hospitalName={hospitalName}
                date={selectedSlot.date}
                timeSlot={selectedSlot.timeSlot}
                patientName={selectedProfile.name}
                type={selectedSlot.type}
              />

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("profile")}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  返回修改
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:from-blue-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      提交中...
                    </span>
                  ) : (
                    "确认挂号"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${month}月${day}日 ${weekdays[d.getDay()]}`;
}

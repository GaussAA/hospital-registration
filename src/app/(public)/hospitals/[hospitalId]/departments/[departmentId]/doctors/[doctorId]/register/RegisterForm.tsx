"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DoctorInfoData } from "@/features/hospital/components/DoctorInfo";
import DoctorInfo from "@/features/hospital/components/DoctorInfo";
import PatientSelector from "@/features/registration/components/PatientSelector";
import type { PatientProfile } from "@/features/registration/components/PatientSelector";
import SlotSelector from "@/features/registration/components/SlotSelector";
import type { ScheduleSlotData } from "@/features/hospital";

interface RegisterFormProps {
  doctor: DoctorInfoData;
  schedules: ScheduleSlotData[];
  hospitalId: string;
  departmentId: string;
}

/**
 * RegisterForm — client component that orchestrates the registration flow.
 * Manages patient profile selection and schedule slot selection,
 * then navigates to the confirm page.
 */
export default function RegisterForm({
  doctor,
  schedules,
  hospitalId,
  departmentId,
}: RegisterFormProps) {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(
    null
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<
    "normal" | "expert" | "special"
  >("normal");

  function handleSlotSelect(
    scheduleId: string,
    type: "normal" | "expert" | "special"
  ) {
    setSelectedScheduleId(scheduleId);
    setSelectedType(type);
  }

  function handleProceed() {
    if (!selectedProfile || !selectedScheduleId) return;
    const params = new URLSearchParams({
      scheduleId: selectedScheduleId,
      profileId: selectedProfile.id,
      type: selectedType,
    });
    router.push(
      `/hospitals/${hospitalId}/departments/${departmentId}/doctors/${doctor.id}/register/confirm?${params}`
    );
  }

  const canProceed = !!selectedProfile && !!selectedScheduleId;

  return (
    <div className="space-y-6">
      {/* Doctor info */}
      <DoctorInfo doctor={doctor} />

      {/* Slot selector */}
      <SlotSelector
        schedules={schedules}
        selectedScheduleId={selectedScheduleId}
        onSelect={handleSlotSelect}
      />

      {/* Patient selector */}
      <PatientSelector
        selectedId={selectedProfile?.id}
        onSelect={setSelectedProfile}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Link
          href={`/hospitals/${hospitalId}/departments/${departmentId}/doctors/${doctor.id}`}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          返回
        </Link>
        <button
          type="button"
          disabled={!canProceed}
          onClick={handleProceed}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          立即挂号
        </button>
      </div>
    </div>
  );
}

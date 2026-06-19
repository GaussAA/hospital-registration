"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Controlled form init from props */

import { useState, useEffect } from "react";
import { Input } from "@/shared/ui";
import { Label } from "@/shared/ui";

interface ScheduleFormData {
  date: string;
  timeSlot: string;
  quota: number;
  type: string;
}

interface ScheduleFormProps {
  doctorId: string;
  initialData?: Partial<ScheduleFormData>;
  onSave: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const timeSlots = [
  { value: "am", label: "上午 (08:00-12:00)" },
  { value: "pm", label: "下午 (13:00-17:00)" },
  { value: "evening", label: "晚间 (18:00-21:00)" },
];

const scheduleTypes = [
  { value: "normal", label: "普通号" },
  { value: "expert", label: "专家号" },
  { value: "special", label: "特需号" },
];

export type { ScheduleFormData };

export default function ScheduleForm({
  doctorId,
  initialData,
  onSave,
  onCancel,
  saving = false,
}: ScheduleFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<ScheduleFormData>({
    date: today,
    timeSlot: "am",
    quota: 30,
    type: "normal",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ScheduleFormData, string>> = {};
    if (!form.date) newErrors.date = "请选择日期";
    if (!form.quota || form.quota < 1) newErrors.quota = "请设置有效号源数";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(form);
  };

  const updateField = (field: keyof ScheduleFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="doctorId" value={doctorId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1">
            日期 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            className={errors.date ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
          />
          {errors.date && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        <div>
          <Label className="mb-1">
            时段
          </Label>
          <select
            value={form.timeSlot}
            onChange={(e) => updateField("timeSlot", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeSlots.map((ts) => (
              <option key={ts.value} value={ts.value}>
                {ts.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="mb-1">
            号源数量 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            min={1}
            max={999}
            value={form.quota}
            onChange={(e) =>
              updateField("quota", parseInt(e.target.value) || 0)
            }
            className={errors.quota ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
          />
          {errors.quota && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.quota}</p>
          )}
        </div>

        <div>
          <Label className="mb-1">
            号源类型
          </Label>
          <select
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {scheduleTypes.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={saving}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Controlled form init from props */

import { useState, useEffect } from "react";
import { Input } from "@/shared/ui";
import { Label } from "@/shared/ui";

interface DoctorFormData {
  name: string;
  title: string;
  specialty: string;
  introduction: string;
  departmentId: string;
}

interface DoctorFormProps {
  departmentId: string;
  initialData?: Partial<DoctorFormData>;
  onSave: (data: DoctorFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const titles = ["主任医师", "副主任医师", "主治医师", "住院医师"];

export type { DoctorFormData };

export default function DoctorForm({
  departmentId,
  initialData,
  onSave,
  onCancel,
  saving = false,
}: DoctorFormProps) {
  const [form, setForm] = useState<DoctorFormData>({
    name: "",
    title: "主治医师",
    specialty: "",
    introduction: "",
    departmentId,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DoctorFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    if (departmentId) {
      setForm((prev) => ({ ...prev, departmentId }));
    }
  }, [departmentId]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DoctorFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "请输入医生姓名";
    if (!form.specialty.trim()) newErrors.specialty = "请输入擅长领域";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(form);
  };

  const updateField = (field: keyof DoctorFormData, value: string) => {
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
      <input type="hidden" name="departmentId" value={departmentId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1">
            医生姓名 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={errors.name ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
            placeholder="请输入姓名"
          />
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label className="mb-1">
            职称
          </Label>
          <select
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {titles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <Label className="mb-1">
            擅长领域 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={form.specialty}
            onChange={(e) => updateField("specialty", e.target.value)}
            className={errors.specialty ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
            placeholder="如：心血管疾病、高血压"
          />
          {errors.specialty && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.specialty}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="mb-1">
            简介
          </Label>
          <textarea
            value={form.introduction}
            onChange={(e) => updateField("introduction", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入医生简介"
          />
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

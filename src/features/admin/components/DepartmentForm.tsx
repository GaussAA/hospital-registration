"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Controlled form init from props */

import { useState, useEffect } from "react";

interface DepartmentFormData {
  name: string;
  description: string;
}

interface DepartmentFormProps {
  hospitalId: string;
  initialData?: Partial<DepartmentFormData>;
  onSave: (data: DepartmentFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export type { DepartmentFormData };

export default function DepartmentForm({
  hospitalId,
  initialData,
  onSave,
  onCancel,
  saving = false,
}: DepartmentFormProps) {
  const [form, setForm] = useState<DepartmentFormData>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DepartmentFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DepartmentFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "请输入科室名称";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(form);
  };

  const updateField = (field: keyof DepartmentFormData, value: string) => {
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
      <input type="hidden" name="hospitalId" value={hospitalId} />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          科室名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 ${
            errors.name ? "border-red-500 dark:border-red-400" : "border-gray-300 dark:border-gray-600"
          }`}
          placeholder="请输入科室名称"
        />
        {errors.name && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          描述
        </label>
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入科室描述"
        />
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

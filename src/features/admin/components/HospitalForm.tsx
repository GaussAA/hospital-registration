"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Controlled form init from props */

import { useState, useEffect } from "react";
import { Input } from "@/shared/ui";
import { Label } from "@/shared/ui";

interface HospitalFormData {
  name: string;
  city: string;
  level: string;
  phone: string;
  address: string;
  description: string;
}

interface HospitalFormProps {
  initialData?: Partial<HospitalFormData>;
  onSave: (data: HospitalFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const levels = ["三甲", "三乙", "二甲", "二乙", "一级"];

export type { HospitalFormData };

export default function HospitalForm({
  initialData,
  onSave,
  onCancel,
  saving = false,
}: HospitalFormProps) {
  const [form, setForm] = useState<HospitalFormData>({
    name: "",
    city: "",
    level: "三甲",
    phone: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof HospitalFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HospitalFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "请输入医院名称";
    if (!form.city.trim()) newErrors.city = "请输入所在城市";
    if (!form.phone.trim()) newErrors.phone = "请输入联系电话";
    if (!form.address.trim()) newErrors.address = "请输入医院地址";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave(form);
  };

  const updateField = (field: keyof HospitalFormData, value: string) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1">
            医院名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={errors.name ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
            placeholder="请输入医院名称"
          />
          {errors.name && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label className="mb-1">
            所在城市 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            className={errors.city ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
            placeholder="请输入城市"
          />
          {errors.city && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <Label className="mb-1">
            医院等级
          </Label>
          <select
            value={form.level}
            onChange={(e) => updateField("level", e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="mb-1">
            联系电话 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={errors.phone ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
            placeholder="请输入电话"
          />
          {errors.phone && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="mb-1">
            医院地址 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className={errors.address ? "border-red-500 dark:border-red-400 focus-visible:ring-red-500/50" : ""}
            placeholder="请输入地址"
          />
          {errors.address && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label className="mb-1">
            描述
          </Label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入医院描述"
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

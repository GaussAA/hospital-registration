"use client";

import { useState, type FormEvent } from "react";

interface PatientFormProps {
  onSuccess?: (profile: { id: string; name: string; idCard: string; phone: string; gender: string }) => void;
  onCancel?: () => void;
}

export default function PatientForm({ onSuccess, onCancel }: PatientFormProps) {
  const [name, setName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/patient-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, idCard, phone, gender }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "添加失败");
        return;
      }

      onSuccess?.(data.data);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">新增就诊人</h3>

      <div>
        <label
          htmlFor="pf-name"
          className="mb-1 block text-sm font-medium text-gray-600"
        >
          姓名
        </label>
        <input
          id="pf-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入就诊人姓名"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
        />
      </div>

      <div>
        <label
          htmlFor="pf-idcard"
          className="mb-1 block text-sm font-medium text-gray-600"
        >
          身份证号
        </label>
        <input
          id="pf-idcard"
          type="text"
          value={idCard}
          onChange={(e) => setIdCard(e.target.value)}
          placeholder="请输入身份证号"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
        />
      </div>

      <div>
        <label
          htmlFor="pf-phone"
          className="mb-1 block text-sm font-medium text-gray-600"
        >
          手机号
        </label>
        <input
          id="pf-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="请输入手机号"
          required
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
        />
      </div>

      <div>
        <label
          htmlFor="pf-gender"
          className="mb-1 block text-sm font-medium text-gray-600"
        >
          性别
        </label>
        <select
          id="pf-gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as "male" | "female")}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
        >
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "保存中..." : "保存"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}

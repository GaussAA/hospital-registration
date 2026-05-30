"use client";

import { useState, useEffect, useRef } from "react";
import PatientForm from "./PatientForm";

export interface PatientProfile {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  gender: string;
}

interface PatientSelectorProps {
  selectedId?: string;
  onSelect: (profile: PatientProfile) => void;
}

/**
 * 脱敏身份证号：显示前3位 + *** + 后4位
 */
function maskIdCard(idCard: string): string {
  if (idCard.length < 7) return idCard;
  return idCard.slice(0, 3) + "***" + idCard.slice(-4);
}

export default function PatientSelector({
  selectedId,
  onSelect,
}: PatientSelectorProps) {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/patient-profiles");
        const data = await res.json();
        if (!mountedRef.current) return;
        if (res.ok && Array.isArray(data.data)) {
          setProfiles(data.data);
        } else {
          setError(data.message || "加载失败");
        }
      } catch {
        if (mountedRef.current) {
          setError("网络错误，请稍后重试");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function reloadProfiles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/patient-profiles");
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setProfiles(data.data);
      } else {
        setError(data.message || "加载失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function handleAddSuccess(newProfile?: PatientProfile) {
    setShowForm(false);
    if (newProfile) {
      onSelect(newProfile);
    }
    reloadProfiles();
  }

  if (showForm) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <PatientForm
          onSuccess={handleAddSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">选择就诊人</h3>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">加载中...</div>
      ) : profiles.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          暂无就诊人，请先添加
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelect(profile)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedId === profile.id
                  ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-200 dark:ring-indigo-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {profile.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {profile.gender === "male" ? "男" : "女"}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                身份证：{maskIdCard(profile.idCard)}　手机：{profile.phone}
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 transition hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
      >
        + 新增就诊人
      </button>
    </div>
  );
}

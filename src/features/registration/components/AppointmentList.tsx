"use client";

import { useToast } from "@/shared/ui/Toast";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { CardSkeleton } from "@/shared/ui/Skeleton";
import type { RegistrationStatus } from "../types";
import type { ApiResponse, PaginatedData } from "@/shared/types/api";

interface RegistrationItem {
  id: string;
  date: string;
  timeSlot: string;
  type: string;
  status: RegistrationStatus;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    title: string;
    department: { name: string };
    hospital: { name: string };
  };
  profile: {
    id: string;
    name: string;
  };
}

const statusLabels: Record<RegistrationStatus, string> = {
  pending: "待就诊",
  done: "已完成",
  cancelled: "已取消",
};

const statusStyles: Record<RegistrationStatus, string> = {
  pending:
    "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  done: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  cancelled: "bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-default)]",
};

const timeSlotLabels: Record<string, string> = {
  am: "上午",
  pm: "下午",
  evening: "晚间",
};

const typeLabels: Record<string, string> = {
  normal: "普通号",
  expert: "专家号",
  special: "特需号",
};

interface AppointmentListProps {
  initialData: PaginatedData<RegistrationItem>;
}

/**
 * AppointmentList — client component for the appointments page.
 * Supports status filtering and displays a list of appointment cards.
 */
export default function AppointmentList({ initialData }: AppointmentListProps) {
  const { showToast } = useToast();
  const [data, setData] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "all">(
    "all"
  );
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (status: RegistrationStatus | "all") => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", pageSize: "10" });
        if (status !== "all") params.set("status", status);

        const res = await fetch(`/api/appointments?${params}`);
        const json: ApiResponse<PaginatedData<RegistrationItem>> =
          await res.json();
        if (mountedRef.current && json.data) {
          setData(json.data);
        }
      } catch {
        // ignore
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    []
  );

  async function handleCancel(id: string) {
    setCancelLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        showToast("已取消挂号", "success");
        fetchData(statusFilter);
      } else {
        const json = await res.json();
        showToast(json.message || "取消失败", "error");
      }
    } catch {
      showToast("网络错误", "error");
    } finally {
      if (mountedRef.current) setCancelLoading(null);
      setCancelTarget(null);
    }
  }

  const filters: { label: string; value: RegistrationStatus | "all" }[] = [
    { label: "全部", value: "all" },
    { label: "待就诊", value: "pending" },
    { label: "已完成", value: "done" },
    { label: "已取消", value: "cancelled" },
  ];

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const isActive = statusFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatusFilter(f.value);
                fetchData(f.value);
              }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!loading && data.list.length === 0 && (
        <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
          暂无挂号记录
        </div>
      )}

      {/* List */}
      {!loading &&
        data.list.map((item) => {
          const isPending = item.status === "pending";
          return (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-4 shadow-sm dark:shadow-none transition hover:shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {item.doctor.hospital.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">/</span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.doctor.department.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {item.doctor.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {item.doctor.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span>{formatDate(item.date)}</span>
                    <span>{timeSlotLabels[item.timeSlot] ?? item.timeSlot}</span>
                    <span>{typeLabels[item.type] ?? item.type}</span>
                    <span>就诊人：{item.profile.name}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[item.status]
                    }`}
                  >
                    {statusLabels[item.status]}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                <Link
                  href={`/appointments/${item.id}`}
                  className="rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  查看详情
                </Link>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(item.id)}
                    disabled={cancelLoading === item.id}
                    className="rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelLoading === item.id ? "取消中..." : "取消挂号"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        title="确认取消"
        message="确定要取消该挂号吗？取消后号源将被释放。"
        variant="warning"
        confirmLabel="确认取消"
        onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
        loading={!!cancelLoading}
      />
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekday = weekdays[d.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

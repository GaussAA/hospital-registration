import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { PageProps } from "@/types/next";
import { verifyToken } from "@/lib/utils/jwt";
import { getRegistrationById } from "@/lib/services/registration.service";

const statusLabels: Record<string, string> = {
  pending: "待就诊",
  done: "已完成",
  cancelled: "已取消",
};

const statusStyles: Record<string, string> = {
  pending:
    "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  done:
    "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  cancelled:
    "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  done: "✅",
  cancelled: "✕",
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

const typeColors: Record<string, string> = {
  normal:
    "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  expert:
    "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300",
  special:
    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

/**
 * Appointment detail page (server component).
 * Displays full registration information in a beautifully designed card.
 */
export default async function AppointmentDetailPage(props: PageProps) {
  const { id } = await props.params;

  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          请先登录
        </h1>
        <Link
          href={`/auth/login?redirect=/appointments/${id}`}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          去登录
        </Link>
      </div>
    );
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          登录已过期
        </h1>
        <Link
          href={`/auth/login?redirect=/appointments/${id}`}
          className="text-blue-600 hover:text-blue-700"
        >
          重新登录
        </Link>
      </div>
    );
  }

  let registration;
  try {
    registration = await getRegistrationById(id);
    if (registration.patientId !== payload.userId) {
      return notFound();
    }
  } catch {
    return notFound();
  }

  const isPending = registration.status === "pending";
  const status = registration.status;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-400 dark:text-gray-500">
        <Link
          href="/appointments"
          className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
        >
          我的挂号
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600 dark:text-gray-400">挂号详情</span>
      </nav>

      {/* ── Detail Card (Flat) ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
        {/* Top gradient strip */}
        <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-6 py-5">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 -mb-6" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusIcons[status] ?? "📋"}</span>
              <div>
                <h1 className="text-lg font-bold text-white">挂号凭证</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-100/80 font-mono">
                    #{registration.id.slice(0, 8)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[status] ?? ""
                    }`}
                  >
                    {statusLabels[status] ?? status}
                  </span>
                </div>
              </div>
            </div>
            {/* Medical cross */}
            <div className="shrink-0 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info sections */}
        <div className="px-5 py-2 divide-y divide-gray-100 dark:divide-gray-700/50">
          {/* Hospital */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label="医院"
            value={registration.doctor.hospital.name}
            highlight
          />
          {/* Department */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
            label="科室"
            value={registration.doctor.department.name}
          />
          {/* Doctor */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              </svg>
            }
            label="医生"
            value={`${registration.doctor.name}`}
            extra={registration.doctor.title}
          />
          {/* Patient */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="就诊人"
            value={registration.profile.name}
          />
          {/* Spacer */}
          <div className="py-1" />
          {/* Date */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            }
            label="就诊日期"
            value={formatDate(registration.date)}
          />
          {/* Time slot */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
            label="就诊时段"
            value={timeSlotLabels[registration.timeSlot] ?? registration.timeSlot}
          />
          {/* Type */}
          <InfoRow
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            }
            label="号类"
            value={typeLabels[registration.type] ?? registration.type}
            badge={
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${typeColors[registration.type] ?? ""}`}>
                {typeLabels[registration.type] ?? registration.type}
              </span>
            }
          />
        </div>

        {/* Bottom footer */}
        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDateTime(registration.createdAt)} 创建
          </span>
          <span className={`text-xs font-medium ${
            status === "pending" ? "text-blue-600 dark:text-blue-400" :
            status === "done" ? "text-green-600 dark:text-green-400" :
            "text-gray-400 dark:text-gray-500"
          }`}>
            {statusLabels[status] ?? status}
          </span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/appointments"
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← 返回列表
        </Link>
        {isPending && (
          <Link
            href={`/appointments/${registration.id}/cancel`}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:from-red-600 hover:to-red-700 shadow-sm"
          >
            取消挂号
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Info Row Component ── */
function InfoRow({
  icon,
  label,
  value,
  extra,
  badge,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: string;
  badge?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center py-3 gap-3">
      {/* Icon */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
        {icon}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 dark:text-gray-500">{label}</div>
        <div className="flex items-center gap-2">
          <span className={`text-sm truncate ${
            highlight
              ? "font-semibold text-gray-900 dark:text-gray-100"
              : "font-medium text-gray-800 dark:text-gray-200"
          }`}>
            {value}
          </span>
          {extra && (
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 rounded-md px-1.5 py-0.5">
              {extra}
            </span>
          )}
          {badge}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

function formatDateTime(dateStr: string | Date): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hours}:${minutes}`;
}

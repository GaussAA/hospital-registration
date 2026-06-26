import Link from "next/link";
import { cookies } from "next/headers";
import type { PaginatedData } from "@/shared/types/api";
import { verifyToken } from "@/shared/utils/jwt";
import { listRegistrations, AppointmentList } from "@/features/registration";

/**
 * Appointments list page (server component).
 * Fetches initial data and passes it to the AppointmentList client component.
 */
export default async function AppointmentsPage() {
  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">
          请先登录
        </h1>
        <p className="mb-6 text-[var(--muted-foreground)]">
          请先登录后再查看挂号记录
        </p>
        <Link
          href="/login?redirect=/appointments"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
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
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">
          登录已过期
        </h1>
        <Link
          href="/login?redirect=/appointments"
          className="text-blue-600 hover:text-blue-700"
        >
          重新登录
        </Link>
      </div>
    );
  }

  // Fetch initial data (first page, all statuses)
  let initialData: PaginatedData<{
    id: string;
    date: string;
    timeSlot: string;
    type: string;
    status: "pending" | "done" | "cancelled";
    createdAt: string;
    doctor: {
      id: string;
      name: string;
      title: string;
      department: { name: string };
      hospital: { name: string };
    };
    profile: { id: string; name: string };
  }> = { list: [], total: 0, page: 1, pageSize: 10 };

  try {
    const result = await listRegistrations({ patientId: payload.userId });
    initialData = result as unknown as typeof initialData;
  } catch {
    // Use empty data
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">我的挂号</h1>
        <Link
          href="/hospitals"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          去挂号
        </Link>
      </div>

      <AppointmentList initialData={initialData} />
    </div>
  );
}

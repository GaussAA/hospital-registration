import Link from "next/link";
import { cookies } from "next/headers";
import type { PageProps } from "@/types/next";
import { verifyToken } from "@/lib/utils/jwt";
import { getRegistrationById } from "@/lib/services/registration.service";
import SuccessCard from "@/components/appointment/SuccessCard";

/**
 * Registration success page (server component).
 * Shows a success message with registration details.
 */
export default async function AppointmentSuccessPage(
  props: PageProps
) {
  const searchParams = await props.searchParams;
  const id = typeof searchParams.id === "string" ? searchParams.id : "";

  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          请先登录
        </h1>
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-700"
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
    return <InvalidState />;
  }

  if (!id) {
    return <InvalidState />;
  }

  let registration: Awaited<ReturnType<typeof getRegistrationById>> | null =
    null;
  try {
    registration = await getRegistrationById(id);
    // Ensure ownership
    if (registration.patientId !== payload.userId) {
      registration = null;
    }
  } catch {
    // Fall through
  }

  if (!registration) {
    return <InvalidState />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SuccessCard
        registrationId={registration.id}
        doctorName={registration.doctor.name}
        departmentName={registration.doctor.department.name}
        hospitalName={registration.doctor.hospital.name}
        date={registration.date}
        timeSlot={registration.timeSlot}
      />

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/appointments"
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700"
        >
          查看挂号记录
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

function InvalidState() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">
        挂号信息不存在
      </h1>
      <Link
        href="/appointments"
        className="text-blue-600 hover:text-blue-700"
      >
        查看挂号记录
      </Link>
    </div>
  );
}

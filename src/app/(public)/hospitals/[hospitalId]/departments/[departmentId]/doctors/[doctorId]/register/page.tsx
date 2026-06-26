import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import type { PageProps } from "@/shared/types/next";
import { verifyToken } from "@/shared/utils/jwt";

export const dynamic = "force-dynamic";

/**
 * RegisterPage — redirects to the doctor detail page where the inline
 * booking flow now lives. Direct access is redirected.
 */
export default async function RegisterPage(props: PageProps) {
  noStore();
  const { hospitalId, departmentId, doctorId } = await props.params;

  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let isAuthenticated = false;
  try {
    if (token) {
      verifyToken(token);
      isAuthenticated = true;
    }
  } catch {
    // Not authenticated
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)]">
          请先登录
        </h1>
        <p className="mb-6 text-[var(--muted-foreground)]">
          请先登录后再进行挂号操作
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(
            `/hospitals/${hospitalId}/departments/${departmentId}/doctors/${doctorId}`
          )}`}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          去登录
        </Link>
      </div>
    );
  }

  // Authenticated — redirect to doctor detail page with inline booking
  redirect(
    `/hospitals/${hospitalId}/departments/${departmentId}/doctors/${doctorId}`
  );
}

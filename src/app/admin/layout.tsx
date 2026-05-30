import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/utils/jwt";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminToastWrapper from "@/components/ui/AdminToastWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?redirect=/admin");
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      redirect("/login?redirect=/admin");
    }
  } catch {
    redirect("/login?redirect=/admin");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 flex flex-col overflow-auto lg:pt-0 pt-14">
        <AdminToastWrapper>{children}</AdminToastWrapper>
      </main>
    </div>
  );
}

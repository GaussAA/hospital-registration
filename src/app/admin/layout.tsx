import { redirect } from "next/navigation";
import { requireAuthServer } from "@/features/auth";
import { AdminSidebar } from "@/features/admin/client";
import AdminToastWrapper from "@/shared/ui/AdminToastWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error } = await requireAuthServer();

  if (error || !user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "admin") {
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

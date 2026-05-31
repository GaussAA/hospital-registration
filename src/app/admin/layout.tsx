import { redirect } from "next/navigation";
import { requireAuthServer } from "@/lib/auth/middleware";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminToastWrapper from "@/components/ui/AdminToastWrapper";

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

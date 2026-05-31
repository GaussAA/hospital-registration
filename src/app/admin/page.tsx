import { redirect } from "next/navigation";
import { requireAuthServer } from "@/lib/auth/middleware";
import { getPrisma } from "@/lib/db";
import AdminHeader from "@/components/layout/AdminHeader";

async function getStats() {
  const prisma = await getPrisma();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [todayAppointments, totalHospitals, totalDoctors] =
    await Promise.all([
      prisma.registration.count({
        where: { date: todayStr },
      }),
      prisma.hospital.count(),
      prisma.doctor.count(),
    ]);

  return { todayAppointments, totalHospitals, totalDoctors };
}

export default async function AdminDashboardPage() {
  const { user, error } = await requireAuthServer();

  if (error || !user) {
    redirect("/login?redirect=/admin");
  }

  if (user.role !== "admin") {
    redirect("/login?redirect=/admin");
  }

  const stats = await getStats();

  const cards = [
    {
      title: "今日挂号数",
      value: stats.todayAppointments,
      color: "bg-blue-500",
      icon: "📋",
    },
    {
      title: "总医院数",
      value: stats.totalHospitals,
      color: "bg-green-500",
      icon: "🏥",
    },
    {
      title: "总医生数",
      value: stats.totalDoctors,
      color: "bg-purple-500",
      icon: "👨‍⚕️",
    },
  ];

  return (
    <>
      <AdminHeader title="仪表盘" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow p-6 flex items-center gap-4"
            >
              <div
                className={`w-14 h-14 ${card.color} rounded-lg flex items-center justify-center text-2xl`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

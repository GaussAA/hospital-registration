"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalHospitals: number;
  totalDoctors: number;
  totalDepartments: number;
  todayAppointments: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    totalHospitals: 0,
    totalDoctors: 0,
    totalDepartments: 0,
    todayAppointments: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setStats(json.data);
        }
      })
      .catch(() => {
        // 静默失败，保持默认 0
      })
      .finally(() => setLoaded(true));
  }, []);

  const items = [
    { label: "入驻医院", value: stats.totalHospitals, icon: "🏥" },
    { label: "专业医生", value: stats.totalDoctors, icon: "👨‍⚕️" },
    { label: "覆盖科室", value: stats.totalDepartments, icon: "🔬" },
    { label: "今日挂号", value: stats.todayAppointments, icon: "📋" },
  ];

  return (
    <section className="relative -mt-10 z-10 max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 text-center shadow-lg dark:shadow-none hover:shadow-xl transition-all hover:-translate-y-1">
              <span className="text-3xl block mb-2">{item.icon}</span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {loaded ? (
                  <AnimatedNumber value={item.value} />
                ) : (
                  <span className="text-gray-300 dark:text-gray-400">---</span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  // 简单计数器动画，只展示数字
  return <span>{value.toLocaleString()}</span>;
}

"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalHospitals: number;
  totalDoctors: number;
  totalDepartments: number;
  todayAppointments: number;
}

const items = [
  { label: "入驻医院", icon: "🏥", gradient: "from-blue-500 to-indigo-500" },
  { label: "专业医生", icon: "👨‍⚕️", gradient: "from-emerald-500 to-teal-500" },
  { label: "覆盖科室", icon: "🔬", gradient: "from-violet-500 to-purple-500" },
  { label: "今日挂号", icon: "📋", gradient: "from-amber-500 to-orange-500" },
];

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
        if (json.data) setStats(json.data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section className="relative -mt-12 z-10 max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <div key={item.label} className="relative group animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            {/* Glow */}
            <div className={`absolute -inset-0.5 bg-gradient-to-br ${item.gradient} rounded-2xl blur opacity-15 group-hover:opacity-30 transition-opacity duration-300`} />
            {/* Card */}
            <div className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5">
              {/* Icon with background */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-muted)] mb-3 text-xl group-hover:scale-110 transition-transform duration-300">
                <span>{item.icon}</span>
              </div>
              {/* Number */}
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">
                {loaded ? (
                  <AnimatedNumber value={item.label === "今日挂号" ? stats.todayAppointments : item.label === "入驻医院" ? stats.totalHospitals : item.label === "专业医生" ? stats.totalDoctors : stats.totalDepartments} />
                ) : (
                  <span className="text-[var(--text-muted)]">---</span>
                )}
              </div>
              {/* Label */}
              <div className="text-sm text-[var(--text-secondary)]">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  return <span>{value.toLocaleString()}</span>;
}

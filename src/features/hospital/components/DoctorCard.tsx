import Link from "next/link";
import Image from "next/image";

export interface DoctorCardData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  avatarUrl: string;
  hospitalId: string;
  departmentId: string;
}

export default function DoctorCard({ doctor }: { doctor: DoctorCardData }) {
  return (
    <div className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex items-start gap-4 card-hover">
      {/* Avatar */}
      <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden ring-2 ring-blue-100 dark:ring-blue-800/30 group-hover:ring-blue-300 dark:group-hover:ring-blue-600/50 transition-all">
        {doctor.avatarUrl ? (
          <Image src={doctor.avatarUrl} alt={doctor.name} width={64} height={64} className="object-cover" />
        ) : (
          <Image src="/images/doctor-avatar.svg" alt={doctor.name} width={64} height={64} className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {doctor.name}
          </h3>
          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
            {doctor.title}
          </span>
        </div>

        <div className="flex items-start gap-1.5 text-sm text-[var(--text-secondary)] mb-1">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1 3.05a.75.75 0 01-1.1-.72L5.97 12l-.75-4.5a.75.75 0 011.1-.72l5.1 3.05m0 0l5.1-3.05a.75.75 0 011.1.72L18.03 12l.75 4.5a.75.75 0 01-1.1.72l-5.1-3.05m-3.72 0l-1.97 6.24a.75.75 0 001.04.91l7.72-2.57m-6.79 0l6.79 0" />
          </svg>
          <span className="line-clamp-1">专长：{doctor.specialty}</span>
        </div>

        <div className="mt-3">
          <Link
            href={`/hospitals/${doctor.hospitalId}/departments/${doctor.departmentId}/doctors/${doctor.id}`}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.97] transition-all duration-200"
          >
            <span>预约挂号</span>
            <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

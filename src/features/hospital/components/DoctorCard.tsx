import Link from "next/link";
import Image from "next/image";
import { Stethoscope, ArrowRight } from "lucide-react";
import { Card, Badge } from "@/shared/ui";
import doctorAvatarFallback from "@/features/hospital/assets/doctor-avatar.svg";

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
    <Card className="p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex items-start gap-4 card-hover">
      {/* Avatar */}
      <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden ring-2 ring-blue-100 dark:ring-blue-800/30 group-hover:ring-blue-300 dark:group-hover:ring-blue-600/50 transition-all">
        {doctor.avatarUrl ? (
          <Image src={doctor.avatarUrl} alt={doctor.name} width={64} height={64} className="object-cover" />
        ) : (
          <Image src={doctorAvatarFallback} alt={doctor.name} width={64} height={64} className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {doctor.name}
          </h3>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
            {doctor.title}
          </Badge>
        </div>

        <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-1">
          <Stethoscope className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="line-clamp-1">专长：{doctor.specialty}</span>
        </div>

        <div className="mt-3">
          <Link
            href={`/hospitals/${doctor.hospitalId}/departments/${doctor.departmentId}/doctors/${doctor.id}`}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.97] transition-all duration-200"
          >
            <span>预约挂号</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

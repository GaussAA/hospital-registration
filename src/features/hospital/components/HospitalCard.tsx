import Link from "next/link";
import { MapPin, Building2, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/shared/ui";

export interface HospitalCardData {
  id: string;
  name: string;
  level: string;
  address: string;
  departmentCount: number;
  doctorCount: number;
}

const levelBadge: Record<string, string> = {
  "三级甲等": "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/30",
  "三级乙等": "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30",
  "二级甲等": "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/30",
  "二级乙等": "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30",
  "一级甲等": "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  "一级乙等": "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
};

export default function HospitalCard({ hospital }: { hospital: HospitalCardData }) {
  const badge = levelBadge[hospital.level] ?? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";

  return (
    <Card className="p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {hospital.name}
        </h3>
        <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          {hospital.level}
        </span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-1">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        <span className="line-clamp-1">{hospital.address}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 mt-2">
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          {hospital.departmentCount} 个科室
        </span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {hospital.doctorCount} 位医生
        </span>
      </div>

      {/* Action */}
      <div className="mt-auto">
        <Link
          href={`/hospitals/${hospital.id}`}
          className="group/btn inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:border-blue-600 transition-all duration-200"
        >
          <span>查看详情</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}

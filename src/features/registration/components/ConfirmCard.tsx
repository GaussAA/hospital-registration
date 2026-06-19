import { ClipboardList } from "lucide-react";
import { Card } from "@/shared/ui";

interface ConfirmCardProps {
  doctorName: string;
  doctorTitle: string;
  departmentName: string;
  hospitalName: string;
  date: string;
  timeSlot: string;
  patientName: string;
  type: string;
}

const timeSlotLabels: Record<string, string> = {
  am: "上午",
  pm: "下午",
  evening: "晚间",
};

const typeLabels: Record<string, string> = {
  normal: "普通号",
  expert: "专家号",
  special: "特需号",
};

export default function ConfirmCard({
  doctorName,
  doctorTitle,
  departmentName,
  hospitalName,
  date,
  timeSlot,
  patientName,
  type,
}: ConfirmCardProps) {
  const formattedDate = formatDate(date);

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden card-hover">
      {/* Header with accent bar */}
      <div className="relative px-5 py-4 border-b border-border/60">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r" />
        <div className="flex items-center gap-2.5 pl-2">
          <ClipboardList className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-semibold text-foreground">挂号确认信息</h3>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 py-3 divide-y divide-border/60">
        <InfoRow label="医院" value={hospitalName} />
        <InfoRow label="科室" value={departmentName} />
        <InfoRow label="医生" value={`${doctorName}  ${doctorTitle}`} />
        <InfoRow label="就诊日期" value={formattedDate} />
        <InfoRow label="就诊时段" value={timeSlotLabels[timeSlot] ?? timeSlot} />
        <InfoRow label="就诊人" value={patientName} />
        <InfoRow label="号类" value={typeLabels[type] ?? type} />
      </div>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekday = weekdays[d.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

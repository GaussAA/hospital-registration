import { Check, Info } from "lucide-react";
import { Card } from "@/shared/ui";

interface SuccessCardProps {
  registrationId: string;
  doctorName: string;
  departmentName: string;
  hospitalName: string;
  date: string;
  timeSlot: string;
}

const timeSlotLabels: Record<string, string> = {
  am: "上午",
  pm: "下午",
  evening: "晚间",
};

export default function SuccessCard({
  registrationId,
  doctorName,
  departmentName,
  hospitalName,
  date,
  timeSlot,
}: SuccessCardProps) {
  const formattedDate = formatDate(date);

  return (
    <Card className="rounded-2xl border-green-200 dark:border-green-800/50 shadow-lg overflow-hidden animate-scale-in">
      {/* Top gradient strip */}
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 px-6 py-6 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 -mb-8" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          {/* Animated checkmark */}
          <div className="shrink-0 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/15 animate-bounce-subtle">
            <Check className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">挂号成功</h1>
            <p className="text-sm text-green-100/80 mt-0.5">
              请妥善保管您的挂号信息，按时就诊
            </p>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 py-3 divide-y divide-border/60">
        <InfoRow label="挂号编号" value={registrationId} mono />
        <InfoRow label="医院" value={hospitalName} />
        <InfoRow label="科室" value={departmentName} />
        <InfoRow label="医生" value={doctorName} />
        <InfoRow label="就诊时间" value={`${formattedDate} ${timeSlotLabels[timeSlot] ?? timeSlot}`} />
      </div>

      {/* Tips section */}
      <div className="border-t border-dashed border-green-200 dark:border-green-800/30 mx-5">
        <div className="py-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-green-500 fill-current" />
            <p className="text-xs font-semibold text-green-700 dark:text-green-300">温馨提示</p>
          </div>
          <ul className="space-y-1 ml-5">
            {[
              "请携带身份证件和医保卡提前30分钟到达医院",
              "如需取消挂号，请至少提前2小时操作",
              "就诊当天请到挂号窗口或自助机取号",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="mt-0.5 text-green-500">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${mono ? "font-mono tracking-wider" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${month}月${day}日 ${weekdays[d.getDay()]}`;
}

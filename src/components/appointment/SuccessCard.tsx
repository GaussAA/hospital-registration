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

/**
 * SuccessCard — displays a success message styled as a consistent
 * flat card with a green gradient top strip, matching the detail card.
 */
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
    <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
      {/* Top green gradient strip */}
      <div className="relative bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 px-6 py-5">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-white/5 -mb-6" />

        <div className="relative flex items-center gap-3">
          {/* Checkmark circle */}
          <div className="shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">挂号成功</h1>
            <p className="text-xs text-green-100/80 mt-0.5">
              请妥善保管您的挂号信息，按时就诊
            </p>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 py-3 divide-y divide-gray-100 dark:divide-gray-700/50">
        <InfoRow label="挂号编号" value={registrationId} mono />
        <InfoRow label="医院" value={hospitalName} />
        <InfoRow label="科室" value={departmentName} />
        <InfoRow label="医生" value={doctorName} />
        <InfoRow label="就诊时间" value={`${formattedDate} ${timeSlotLabels[timeSlot] ?? timeSlot}`} />
      </div>

      {/* Tips section */}
      <div className="border-t border-dashed border-green-200 dark:border-green-800/50 mx-5">
        <div className="py-3 space-y-1">
          <p className="text-xs font-medium text-green-700 dark:text-green-300">💡 温馨提示</p>
          <ul className="space-y-0.5">
            {[
              "请携带身份证件和医保卡提前30分钟到达医院",
              "如需取消挂号，请至少提前2小时操作",
              "就诊当天请到挂号窗口或自助机取号",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="mt-0.5">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-medium text-gray-800 dark:text-gray-100 ${mono ? "font-mono" : ""}`}>
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

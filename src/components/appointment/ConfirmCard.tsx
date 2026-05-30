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

/**
 * ConfirmCard — displays a summary of the registration details for confirmation.
 */
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] shadow-sm dark:shadow-none">
      <div className="border-b border-gray-100 dark:border-gray-700/50 px-5 py-3.5">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">挂号确认信息</h3>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700/50 px-5 py-2">
        <InfoRow label="医院" value={hospitalName} />
        <InfoRow label="科室" value={departmentName} />
        <InfoRow label="医生" value={`${doctorName}  ${doctorTitle}`} />
        <InfoRow label="就诊日期" value={formattedDate} />
        <InfoRow label="就诊时段" value={timeSlotLabels[timeSlot] ?? timeSlot} />
        <InfoRow label="就诊人" value={patientName} />
        <InfoRow label="号类" value={typeLabels[type] ?? type} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
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

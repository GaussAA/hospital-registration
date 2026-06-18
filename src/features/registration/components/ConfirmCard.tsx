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
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden card-hover">
      {/* Header with accent bar */}
      <div className="relative px-5 py-4 border-b border-[var(--border-light)]">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r" />
        <div className="flex items-center gap-2.5 pl-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">挂号确认信息</h3>
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 py-3 divide-y divide-[var(--border-light)]">
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
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
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

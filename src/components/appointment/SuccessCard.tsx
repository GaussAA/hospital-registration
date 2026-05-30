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
 * SuccessCard — displays a success message after a successful registration.
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
    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-6 text-center">
      {/* Green checkmark icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-xl font-bold text-green-800 dark:text-green-200">挂号成功</h2>
      <p className="mb-4 text-sm text-green-600 dark:text-green-400">
        请妥善保管您的挂号信息，按时就诊
      </p>

      <div className="mx-auto max-w-sm space-y-2 rounded-lg bg-white dark:bg-[#1e293b] px-4 py-3 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">挂号编号</span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">
            {registrationId}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">医院</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">{hospitalName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">科室</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">{departmentName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">医生</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">{doctorName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">就诊时间</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {formattedDate} {timeSlotLabels[timeSlot] ?? timeSlot}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-left text-sm text-amber-700 dark:text-amber-300">
        <p className="font-medium">温馨提示</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-600 dark:text-amber-400">
          <li>请携带身份证件和医保卡提前30分钟到达医院</li>
          <li>如需取消挂号，请至少提前2小时操作</li>
          <li>就诊当天请到挂号窗口或自助机取号</li>
        </ul>
      </div>
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

type CalendarDay = {
  date: string;
  status: "none" | "partial" | "all";
};

type CompletionCalendarProps = {
  days: CalendarDay[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusClass(status: CalendarDay["status"]) {
  if (status === "all") return "bg-status-all";
  if (status === "partial") return "bg-status-partial";
  return "bg-status-none";
}

export function CompletionCalendar({ days }: CompletionCalendarProps) {
  if (days.length === 0) {
    return <p className="text-sm text-text-secondary">No calendar data yet.</p>;
  }

  const firstDate = new Date(`${days[0].date}T00:00:00Z`);
  const monthLabel = firstDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });

  const firstWeekday = firstDate.getUTCDay();
  const paddedDays: Array<CalendarDay | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{monthLabel}</h3>
        <div className="flex items-center gap-2 text-[10px] text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-pill bg-status-none" aria-hidden />
            None
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-pill bg-status-partial" aria-hidden />
            Some
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-pill bg-status-all" aria-hidden />
            All
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-text-secondary">
        {weekdayLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {paddedDays.map((day, index) => (
          <div key={day ? day.date : `empty-${index}`}>
            {day ? (
              <div
                className={`flex h-9 items-center justify-center rounded-button text-xs font-semibold text-white ${statusClass(day.status)}`}
                aria-label={`${day.date} ${day.status}`}
              >
                {new Date(`${day.date}T00:00:00Z`).getUTCDate()}
              </div>
            ) : (
              <div className="h-9" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { CalendarDays } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CalendarDays;
  tone: "primary" | "blue" | "success" | "amber";
}) {
  return (
    <article className="group rounded-lg border border-border bg-card p-5 shadow-surface transition-transform duration-200 hover:-translate-y-0.5">
      <div className="mb-5 flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`metric-icon metric-icon-${tone}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="font-display text-3xl font-semibold text-card-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

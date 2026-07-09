import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  accent?: boolean;
}

export function StatCard({ label, value, highlight = false, accent = false }: StatCardProps) {
  return (
    <div className={cn("card p-4", highlight && "ring-1 ring-primary-200", accent && "ring-1 ring-amber-300 bg-amber-50")}>
      <p className="text-xs text-surface-500">{label}</p>
      <p className={cn("text-lg font-bold", highlight ? "text-primary-600" : accent ? "text-amber-700" : "text-surface-800")}>
        {value}
      </p>
    </div>
  );
}
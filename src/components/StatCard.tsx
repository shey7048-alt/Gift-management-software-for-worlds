import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  colorClass?: string;
}

export default function StatCard({ id, title, value, subtitle, icon: Icon, colorClass = "text-slate-600 bg-slate-50" }: StatCardProps) {
  return (
    <div id={id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs font-medium text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

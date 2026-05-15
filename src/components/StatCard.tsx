import { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  detail: string;
  color: "purple" | "green" | "blue" | "red";
};

export function StatCard({ icon: Icon, title, value, detail, color }: StatCardProps) {
  const styles = {
    purple: "bg-[#726E97]/10 text-[#726E97]",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-500",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 leading-tight mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className={`text-xs mt-1 ${color === "red" ? "text-[#726E97]" : "text-emerald-500"}`}>
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}
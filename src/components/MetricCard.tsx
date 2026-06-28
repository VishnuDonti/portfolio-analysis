import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string;
  subtext: string;
  subtextColor?: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export default function MetricCard({
  id,
  title,
  value,
  subtext,
  subtextColor = "text-slate-500",
  icon: Icon,
  iconColor,
  bgColor,
}: MetricCardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm relative overflow-hidden"
    >
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <h3 className="text-xl font-mono font-bold text-slate-900 font-tabular tracking-tight">{value}</h3>
        <p className={`text-xs ${subtextColor} font-medium`}>{subtext}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${bgColor || "bg-slate-100"} ${iconColor || "text-slate-600"} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
    </motion.div>
  );
}

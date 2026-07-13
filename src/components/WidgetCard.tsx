import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  icon: ReactNode;
  label: string;
  color: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function WidgetCard({ icon, label, color, children, action, className }: WidgetCardProps) {
  return (
    <div className={cn("olympus-card overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-border p-4">
        <span style={{ color }}>{icon}</span>
        <span className="text-sm font-medium text-primary">{label}</span>
      </div>
      <div className="p-4">
        {children}
      </div>
      {action && <div className="border-t border-border px-4 py-3">{action}</div>}
    </div>
  );
}

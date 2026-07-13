import { cn } from "@/lib/utils";

interface EmptyPageProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyPage({ icon, title, description, action, className }: EmptyPageProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
      {icon && <div className="mb-4 text-muted-foreground/40">{icon}</div>}
      <h2 className="font-display text-xl text-primary">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

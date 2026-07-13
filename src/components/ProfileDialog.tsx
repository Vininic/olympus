import { Cloud, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/I18nProvider";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ open, onOpenChange }: Props) {
  const { session, signOut } = useAuth();
  const t = useT();
  if (!session) return null;
  const cloud = !!session.email;
  const initial = session.name.trim().charAt(0).toUpperCase() || "O";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-xl">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gilt text-xs font-semibold text-primary-deep">
              {initial}
            </span>
            {session.name}
          </DialogTitle>
          <DialogDescription>
            {cloud ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Cloud className="h-3 w-3" /> {session.email}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MonitorSmartphone className="h-3 w-3" /> {t.common.thisBrowser}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => { signOut(); onOpenChange(false); }}>
            {t.common.signOut}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

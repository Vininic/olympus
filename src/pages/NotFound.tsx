import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyPage } from "@/components/EmptyPage";
import { useT } from "@/lib/i18n/I18nProvider";

export default function NotFound() {
  const t = useT();
  const n = t.olympus.notFound;

  return (
    <EmptyPage
      title={n.title}
      description={n.lead}
      action={
        <Button asChild>
          <Link to="/desk"><ArrowLeft className="mr-2 h-4 w-4" /> {n.backToApp}</Link>
        </Button>
      }
    />
  );
}

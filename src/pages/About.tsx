import { ExternalLink, Github, Linkedin, Mail } from "lucide-react";
import { useT } from "@/lib/i18n/I18nProvider";

export default function About() {
  const t = useT();
  const a = t.olympus.about;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="mb-1 text-xs uppercase tracking-[0.3em] text-secondary">{a.eyebrow}</p>
        <h1 className="font-display text-2xl text-primary">{a.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.lead}</p>
      </div>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{a.projectEyebrow}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-2 font-display text-lg text-primary">{a.projectTitle}</h3>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{a.projectLead}</p>
          <div className="flex flex-col gap-3">
            {a.stack.map((item) => (
              <div key={item.name} className="rounded-lg border border-border bg-surface-raised p-3">
                <span className="text-sm font-medium text-primary">{item.name}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-secondary">{a.linksEyebrow}</p>
        <div className="olympus-card p-5">
          <h3 className="mb-3 font-display text-lg text-primary">{a.linksTitle}</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: Github, label: "GitHub", desc: a.githubDesc, url: "https://github.com/Vininic" },
              { icon: Linkedin, label: "LinkedIn", desc: a.linkedinDesc, url: "https://linkedin.com/in/vinicius-espindola" },
              { icon: Mail, label: "Email", desc: a.emailDesc, url: "mailto:vinicius@example.com" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 transition-colors hover:bg-accent/10"
              >
                <link.icon className="h-4 w-4 shrink-0 text-secondary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-primary">{link.label}</div>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { useRef, useState } from "react";
import { Check, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AVATAR_COLORS, AVATAR_GLYPHS } from "./Avatar";
import { OlympusMark } from "@/components/brand/OlympusMark";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { useAuth } from "@/lib/auth";
import { useHub } from "@/lib/i18n/I18nProvider";
import { usePrefs } from "@/lib/prefs/store";
import { setAvatar } from "@/lib/prefs/service";
import { defaultAvatar, type AvatarPrefs } from "@/lib/prefs/types";
import { toAvatarDataUrl } from "@/lib/ui/image";
import { SUITE_APPS, type SuiteAppId } from "@/lib/suite/registry";
import { cn } from "@/lib/utils";

function isSuiteApp(glyph: string): glyph is SuiteAppId {
  return SUITE_APPS.some((a) => a.id === glyph);
}

/** The account's appearance.
 *
 *  Three sources, and no generic cartoon faces: the reference component this
 *  replaces shipped four stock illustrated avatars that could belong to any
 *  product. What this suite actually has is six marks and six hues, so the
 *  glyph set is the Alpha plus the five app marks, and the palette is the hub's
 *  gilt plus each app's own colour. Choosing "Pluto green + the medallion" says
 *  something; choosing "smiling blob #3" does not.
 *
 *  No name field here — the display name is one row up in Settings → Conta, and
 *  the same control in two places is the duplication the shell contract
 *  forbids. */
export function AvatarPicker({ className }: { className?: string }) {
  const h = useHub();
  const a = h.account;
  const { session } = useAuth();
  const { prefs, update } = usePrefs();
  const avatar: AvatarPrefs = { ...defaultAvatar(), ...(prefs.avatar ?? {}) };
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (next: Partial<AvatarPrefs>) => update((p) => setAvatar(p, next));

  async function onFile(file: File) {
    setError(null);
    const result = await toAvatarDataUrl(file);
    if ("error" in result) {
      setError(
        result.error === "unsupported" ? a.avatarErrUnsupported
          : result.error === "too-large" ? a.avatarErrTooLarge
          : a.avatarErrFailed,
      );
      return;
    }
    patch({ kind: "image", image: result.dataUrl });
  }

  const kinds: { id: AvatarPrefs["kind"]; label: string }[] = [
    { id: "monogram", label: a.avatarMonogram },
    { id: "glyph", label: a.avatarGlyph },
    { id: "image", label: a.avatarImage },
  ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-4">
        <Avatar avatar={avatar} name={session?.name} size={72} className="shadow-soft" />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-primary">{a.avatarTitle}</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{a.avatarDesc}</p>
          <div className="mt-2 flex gap-1 rounded-lg border border-border bg-surface-veil/50 p-0.5">
            {kinds.map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => patch({ kind: kind.id })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  avatar.kind === kind.id
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {kind.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {avatar.kind === "glyph" && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {a.avatarGlyph}
          </p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_GLYPHS.map((glyph) => {
              const selected = avatar.glyph === glyph;
              return (
                <button
                  key={glyph}
                  type="button"
                  onClick={() => patch({ glyph })}
                  aria-pressed={selected}
                  aria-label={glyph}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-lg border transition-colors",
                    selected ? "border-secondary bg-secondary/10 text-primary" : "border-border text-muted-foreground hover:text-primary",
                  )}
                >
                  {isSuiteApp(glyph)
                    ? <SuiteMark app={glyph} className="h-5 w-5" />
                    : <OlympusMark className="h-5 w-5" strokeWidth={5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {avatar.kind === "image" ? (
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {avatar.image ? a.avatarReplace : a.avatarUpload}
            </Button>
            {avatar.image && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => patch({ image: "", kind: "monogram" })}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {a.avatarRemove}
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{a.avatarUploadHint}</p>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      ) : (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {a.avatarColor}
          </p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((color) => {
              const selected = avatar.color.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => patch({ color: color.hex })}
                  aria-pressed={selected}
                  aria-label={color.id}
                  className="grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-105"
                  style={{
                    background: color.hex,
                    boxShadow: selected ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${color.hex}` : undefined,
                  }}
                >
                  {selected && <Check className="h-3.5 w-3.5" style={{ color: "#1A1714" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

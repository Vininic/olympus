import { OlympusMark } from "@/components/brand/OlympusMark";
import { SuiteMark } from "@/components/brand/SuiteMarks";
import { defaultAvatar, type AvatarPrefs } from "@/lib/prefs/types";
import { SUITE_APPS, type SuiteAppId } from "@/lib/suite/registry";
import { cn } from "@/lib/utils";

/** The palette the picker offers: the hub's gilt plus each app's own hue.
 *  Deliberately not a generic color wheel — every choice here already means
 *  something in the suite. */
export const AVATAR_COLORS: { id: string; hex: string }[] = [
  { id: "gilt", hex: "#C9B99A" },
  ...SUITE_APPS.map((app) => ({ id: app.id, hex: app.color })),
];

export const AVATAR_GLYPHS: string[] = ["olympus", ...SUITE_APPS.map((a) => a.id)];

function isSuiteApp(glyph: string): glyph is SuiteAppId {
  return SUITE_APPS.some((a) => a.id === glyph);
}

/** Renders whatever the account's avatar currently is, at any size.
 *
 *  One component for the sidebar, the account page and the picker's own
 *  preview, so the thing you choose is literally the thing you see everywhere
 *  else — no second implementation to drift. */
export function Avatar({
  avatar, name, size = 32, className,
}: {
  avatar?: AvatarPrefs;
  name?: string;
  /** Pixels. Glyph and letter scale from it. */
  size?: number;
  className?: string;
}) {
  const a = { ...defaultAvatar(), ...(avatar ?? {}) };
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "O";

  const base = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full",
    className,
  );

  if (a.kind === "image" && a.image) {
    return (
      <span className={base} style={{ width: size, height: size }}>
        <img src={a.image} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  if (a.kind === "glyph") {
    return (
      <span
        className={base}
        style={{ width: size, height: size, background: `${a.color}22`, color: a.color }}
      >
        {isSuiteApp(a.glyph) ? (
          <SuiteMark app={a.glyph} className="h-[58%] w-[58%]" />
        ) : (
          <OlympusMark className="h-[58%] w-[58%]" strokeWidth={5} />
        )}
      </span>
    );
  }

  return (
    <span
      className={cn(base, "font-display font-semibold")}
      style={{
        width: size,
        height: size,
        background: a.color,
        color: "#1A1714",
        fontSize: size * 0.44,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

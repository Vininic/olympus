import type { PanelId, SuiteAppId } from "@/lib/suite/registry";

export const PREFS_VERSION = 2;
export const USER_DATA_KEY = "suite-prefs";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeSkin = "marble" | "nocturne" | "parchment" | "sepia" | "ink";
export type Density = "comfortable" | "compact";
export type StartPage = "home" | "chat";

export interface AppearancePrefs {
  mode: ThemeMode;
  skin: ThemeSkin;
  density: Density;
  reduceMotion: boolean;
}

export interface PanelPrefs {
  /** Explicit order; unknown panels fall to the end in registry order. */
  order: PanelId[];
  hidden: PanelId[];
}

export interface NotificationPrefs {
  enabled: boolean;
  /** Per-app opt-out. An app missing from the map is treated as enabled. */
  apps: Partial<Record<SuiteAppId, boolean>>;
  quietHours: { enabled: boolean; from: string; to: string };
}

export interface SpeechPrefs {
  /** SpeechSynthesisVoice.voiceURI, or "" for the locale default. */
  voiceURI: string;
  rate: number;
  pitch: number;
  autoSpeak: boolean;
}

/** How you appear across the suite.
 *
 *  `monogram` is the default and needs nothing but a name. `glyph` picks one of
 *  the suite's own marks — the reason the picker offers no generic cartoon
 *  faces: an avatar set that could belong to any product says nothing, while
 *  the Alpha or an app's mark says which corner of the suite you live in.
 *  `image` holds a data URL, downscaled before it is ever stored. */
export interface AvatarPrefs {
  kind: "monogram" | "glyph" | "image";
  /** For `glyph`: "olympus" or a SuiteAppId. */
  glyph: string;
  /** Hex, from the suite palette. Tints monogram and glyph alike. */
  color: string;
  /** For `image`: a downscaled data URL. Empty otherwise. */
  image: string;
}

export interface ExtensionPrefs {
  /** Extension/app id → enabled. Absent means "use the registry default". */
  enabled: Record<string, boolean>;
}

export interface SuitePrefs {
  meta: { version: number };
  displayName?: string;
  /** Legacy v1 field. Kept so older siblings reading `suite-prefs.theme`
   *  keep working — `appearance.mode` is the source of truth in Olympus. */
  theme?: "light" | "dark";
  locale?: string;
  startPage?: StartPage;
  appearance?: AppearancePrefs;
  panels?: PanelPrefs;
  notifications?: NotificationPrefs;
  speech?: SpeechPrefs;
  extensions?: ExtensionPrefs;
  avatar?: AvatarPrefs;
}

export function defaultAvatar(): AvatarPrefs {
  return { kind: "monogram", glyph: "olympus", color: "#C9B99A", image: "" };
}

export function defaultAppearance(): AppearancePrefs {
  return { mode: "system", skin: "marble", density: "comfortable", reduceMotion: false };
}

export function defaultPanels(): PanelPrefs {
  return { order: [], hidden: [] };
}

export function defaultNotifications(): NotificationPrefs {
  return { enabled: false, apps: {}, quietHours: { enabled: false, from: "22:00", to: "07:00" } };
}

export function defaultSpeech(): SpeechPrefs {
  return { voiceURI: "", rate: 1, pitch: 1, autoSpeak: false };
}

export function emptyPrefs(): SuitePrefs {
  return {
    meta: { version: PREFS_VERSION },
    startPage: "home",
    appearance: defaultAppearance(),
    panels: defaultPanels(),
    notifications: defaultNotifications(),
    speech: defaultSpeech(),
    extensions: { enabled: {} },
    avatar: defaultAvatar(),
  };
}

/** Version 0 (garbage) and version 1 (theme/name/locale only) both upgrade
 *  here. v1's flat `theme` seeds `appearance.mode` so a returning user keeps
 *  the look they had; the flat field stays written for sibling compatibility. */
export function migrate(raw: unknown): SuitePrefs {
  const base = emptyPrefs();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<SuitePrefs>;

  const appearance: AppearancePrefs = {
    ...defaultAppearance(),
    ...(p.appearance ?? {}),
  };
  if (!p.appearance && (p.theme === "light" || p.theme === "dark")) {
    appearance.mode = p.theme;
  }

  return {
    meta: { version: PREFS_VERSION },
    displayName: p.displayName,
    theme: appearance.mode === "system" ? p.theme : (appearance.mode as "light" | "dark"),
    locale: p.locale,
    startPage: p.startPage === "chat" ? "chat" : "home",
    appearance,
    panels: { ...defaultPanels(), ...(p.panels ?? {}) },
    notifications: {
      ...defaultNotifications(),
      ...(p.notifications ?? {}),
      quietHours: { ...defaultNotifications().quietHours, ...(p.notifications?.quietHours ?? {}) },
      apps: { ...(p.notifications?.apps ?? {}) },
    },
    speech: { ...defaultSpeech(), ...(p.speech ?? {}) },
    extensions: { enabled: { ...(p.extensions?.enabled ?? {}) } },
    avatar: { ...defaultAvatar(), ...(p.avatar ?? {}) },
  };
}

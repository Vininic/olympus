import { describe, expect, it } from "vitest";
import { PREFS_VERSION, migrate } from "./types";

describe("prefs migrate", () => {
  it("turns garbage into a complete default document", () => {
    const p = migrate(null);
    expect(p.meta.version).toBe(PREFS_VERSION);
    expect(p.appearance?.skin).toBe("marble");
    expect(p.speech?.rate).toBe(1);
    expect(p.panels?.hidden).toEqual([]);
  });

  it("seeds appearance.mode from a v1 flat theme", () => {
    const p = migrate({ meta: { version: 1 }, theme: "dark", displayName: "Vin" });
    expect(p.appearance?.mode).toBe("dark");
    expect(p.displayName).toBe("Vin");
  });

  it("keeps writing the flat theme field for older siblings", () => {
    const p = migrate({ appearance: { mode: "dark", skin: "ink", density: "compact", reduceMotion: false } });
    expect(p.theme).toBe("dark");
    expect(p.appearance?.skin).toBe("ink");
  });

  it("leaves the flat theme alone when the mode follows the system", () => {
    const p = migrate({ theme: "light", appearance: { mode: "system", skin: "marble", density: "comfortable", reduceMotion: false } });
    expect(p.theme).toBe("light");
  });

  it("does not lose nested notification settings", () => {
    const p = migrate({ notifications: { enabled: true, apps: { pluto: false }, quietHours: { enabled: true, from: "23:00", to: "06:00" } } });
    expect(p.notifications?.enabled).toBe(true);
    expect(p.notifications?.apps.pluto).toBe(false);
    expect(p.notifications?.quietHours.from).toBe("23:00");
  });
});

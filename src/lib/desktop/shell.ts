/** The optional desktop shell.
 *
 *  Olympus runs as a normal web app and as a PWA; `src-tauri/` adds a third
 *  way to run it, purely to get one capability a browser cannot offer: a panel
 *  window with no chrome, no taskbar entry, and — optionally — pinned above
 *  other applications, so a day planner can sit on the desktop like a widget.
 *
 *  Everything here is behind a runtime check. In a browser `isDesktopShell()`
 *  is false, none of these functions are reachable, and no Tauri code is in the
 *  bundle: the bridge is `window.__TAURI__`, published by the shell itself via
 *  `withGlobalTauri`, not an npm package. The web build does not know this
 *  directory exists. */

type Invoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

interface TauriGlobal {
  core?: { invoke?: Invoke };
}

function bridge(): Invoke | null {
  if (typeof window === "undefined") return null;
  const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
  return tauri?.core?.invoke ?? null;
}

/** True only when running inside the Tauri shell. */
export function isDesktopShell(): boolean {
  return bridge() !== null;
}

async function invoke(cmd: string, args: Record<string, unknown>): Promise<boolean> {
  const call = bridge();
  if (!call) return false;
  try {
    await call(cmd, args);
    return true;
  } catch {
    // A failed command must not take the page down — the caller falls back to
    // the browser path, which always works.
    return false;
  }
}

export function openPanelWidget(
  panelId: string,
  options: { alwaysOnTop: boolean; width: number; height: number },
): Promise<boolean> {
  return invoke("open_panel_widget", {
    panelId,
    alwaysOnTop: options.alwaysOnTop,
    width: options.width,
    height: options.height,
  });
}

export function setPanelAlwaysOnTop(panelId: string, alwaysOnTop: boolean): Promise<boolean> {
  return invoke("set_panel_always_on_top", { panelId, alwaysOnTop });
}

export function closePanelWidget(panelId: string): Promise<boolean> {
  return invoke("close_panel_widget", { panelId });
}

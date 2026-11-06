// Olympus desktop shell.
//
// This exists for exactly one capability the web cannot have: a panel window
// that behaves like a desktop widget — no chrome, no taskbar entry, and pinned
// above other windows so a day planner stays visible while you work in
// something else. Everything else the app does already works in a browser, and
// nothing here reimplements it: the window loads the same `/panel/:id` route
// the web build serves.
//
// The web build is unaffected by this directory. `npm run build` never touches
// it; only `tauri build` does.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Opens (or focuses) a widget window for one panel.
///
/// `always_on_top` is the switch the user controls from Settings. With it off
/// the window is an ordinary floating window — the "sticky note that lives on
/// the desktop" behaviour — and with it on it stays above other applications.
#[tauri::command]
async fn open_panel_widget(
    app: tauri::AppHandle,
    panel_id: String,
    always_on_top: bool,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = format!("panel-{panel_id}");

    // Already open: focus it instead of stacking duplicates.
    if let Some(existing) = app.get_webview_window(&label) {
        existing.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
        existing.show().map_err(|e| e.to_string())?;
        existing.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::App(format!("panel/{panel_id}").into()),
    )
    .title(format!("Olympus — {panel_id}"))
    .inner_size(width, height)
    .min_inner_size(280.0, 240.0)
    .decorations(false)
    .always_on_top(always_on_top)
    // Widgets do not belong in the taskbar; the hub window is the app's entry.
    .skip_taskbar(true)
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Toggles pinning on a widget window that is already open.
#[tauri::command]
fn set_panel_always_on_top(
    app: tauri::AppHandle,
    panel_id: String,
    always_on_top: bool,
) -> Result<(), String> {
    let label = format!("panel-{panel_id}");
    let window = app
        .get_webview_window(&label)
        .ok_or_else(|| format!("no window for {panel_id}"))?;
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

#[tauri::command]
fn close_panel_widget(app: tauri::AppHandle, panel_id: String) -> Result<(), String> {
    let label = format!("panel-{panel_id}");
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_panel_widget,
            set_panel_always_on_top,
            close_panel_widget
        ])
        .run(tauri::generate_context!())
        .expect("error while running Olympus");
}

export type UiSurface = "popup" | "sidepanel";

const UI_SURFACE_KEY = "brume_ui_surface";

export async function readUiSurface(): Promise<UiSurface> {
  const raw = await chrome.storage.local.get(UI_SURFACE_KEY);
  return raw[UI_SURFACE_KEY] === "popup" ? "popup" : "sidepanel";
}

export function applyUiSurfaceClass(surface: UiSurface): void {
  const root = document.documentElement;
  root.classList.remove("brume-shell-popup", "brume-shell-side");
  root.classList.add(surface === "popup" ? "brume-shell-popup" : "brume-shell-side");
}

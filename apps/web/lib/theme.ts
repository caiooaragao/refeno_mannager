export type Theme = "dark" | "light";

export const THEME_COOKIE = "theme";

export function parseTheme(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

export function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

export type Theme = "dark" | "light";

export const THEME_COOKIE = "theme";
export const DEFAULT_THEME: Theme = "light";

export function parseTheme(value: string | undefined): Theme {
  if (value === "dark" || value === "light") {
    return value;
  }

  return DEFAULT_THEME;
}

export function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

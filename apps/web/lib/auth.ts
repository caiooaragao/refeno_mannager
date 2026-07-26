const AUTH_KEY = "refeno_admin_auth";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function login(
  user: string,
  password: string,
  expectedUser: string,
  expectedPassword: string
): boolean {
  if (user === expectedUser && password === expectedPassword) {
    sessionStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

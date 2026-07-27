"use client";

import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import type { Theme } from "@/lib/theme";

interface AppProvidersProps {
  children: React.ReactNode;
  initialTheme: Theme;
}

export function AppProviders({ children, initialTheme }: AppProvidersProps) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ThemeProvider>
  );
}

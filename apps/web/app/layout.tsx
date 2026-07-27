import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans, Inter, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppProviders } from "@/components/providers/AppProviders";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Refeno Manager",
  description: "Gestão de inspeções de embarcações",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} ${ibmPlexSans.variable}${
        theme === "light" ? " light" : ""
      }`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <AppProviders initialTheme={theme}>
          <PageContainer>
            <SiteHeader />
            {children}
          </PageContainer>
        </AppProviders>
      </body>
    </html>
  );
}

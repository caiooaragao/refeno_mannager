import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata: Metadata = {
  title: "Refeno Manager",
  description: "Gestão de inspeções de embarcações",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <PageContainer>
          <SiteHeader />
          {children}
        </PageContainer>
      </body>
    </html>
  );
}

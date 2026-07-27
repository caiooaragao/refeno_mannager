import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SiteHeaderProps {
  title?: string;
  subtitle?: string;
}

export function SiteHeader({
  title = "Refeno Manager",
  subtitle,
}: SiteHeaderProps) {
  return (
    <header className="forest-glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-6 sm:py-4 md:px-16">
        <Link href="/forms/refeno" className="shrink-0">
          <Image
            src="/images/logo_refeno.png"
            alt="REFENO - Regata Recife Fernando de Noronha"
            width={180}
            height={56}
            className="h-10 w-auto sm:h-12"
            priority
          />
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-4">
          <ThemeToggle />
          <Link
            href="/forms/refeno"
            className="cursor-pointer text-secondary transition-colors hover:text-primary"
          >
            Formulário
          </Link>
          <Link href="/admin" className="forest-btn-primary px-4 py-1.5 text-xs sm:text-sm">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

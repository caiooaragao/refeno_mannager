import Link from "next/link";

interface SiteHeaderProps {
  title?: string;
  subtitle?: string;
}

export function SiteHeader({
  title = "Refeno Manager",
  subtitle,
}: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
        style={{ maxWidth: "64rem" }}
      >
        <div>
          <Link
            href="/"
            className="text-xl font-bold text-blue-900 hover:text-blue-700"
          >
            {title}
          </Link>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/forms/refeno"
            className="text-blue-800 hover:text-blue-600"
          >
            Formulário
          </Link>
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 text-white"
            style={{ backgroundColor: "#1e5a8a" }}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

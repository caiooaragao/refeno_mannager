import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main
      className={`min-h-screen bg-slate-100 ${className}`}
      style={{ fontFamily: "Segoe UI, system-ui, sans-serif" }}
    >
      {children}
    </main>
  );
}

import type { ReactNode } from "react";

interface SuccessDialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  ariaLabelledBy: string;
}

export function SuccessDialog({
  title,
  children,
  onClose,
  ariaLabelledBy,
}: SuccessDialogProps) {
  return (
    <div
      className="forest-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <div className="forest-modal max-w-md text-center">
        <div className="forest-success-icon mx-auto mb-5">
          <svg
            className="h-8 w-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h2 id={ariaLabelledBy} className="text-headline-sm text-on-surface">
          {title}
        </h2>

        <div className="mt-4 text-body-sm leading-relaxed text-on-primary-container sm:text-body-md">
          {children}
        </div>

        <button type="button" onClick={onClose} className="forest-btn-primary mt-6 px-6 py-2.5">
          Fechar
        </button>
      </div>
    </div>
  );
}

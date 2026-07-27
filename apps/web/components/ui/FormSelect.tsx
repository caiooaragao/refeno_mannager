import { ReactNode, SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  children: ReactNode;
  loading?: boolean;
}

export function FormSelect({
  label,
  id,
  children,
  loading = false,
  disabled,
  className = "",
  ...selectProps
}: FormSelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="forest-label">
        {label}
        {loading && (
          <span className="ml-2 text-xs font-normal text-on-surface-variant">
            Carregando...
          </span>
        )}
      </label>
      <select
        id={id}
        className={`forest-input ${className}`}
        disabled={disabled || loading}
        {...selectProps}
        autoComplete="off"
      >
        {children}
      </select>
    </div>
  );
}

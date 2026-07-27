import { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  loading?: boolean;
}

export function FormField({
  label,
  id,
  loading = false,
  disabled,
  className = "",
  ...inputProps
}: FormFieldProps) {
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
      <input
        id={id}
        className={`forest-input ${className}`}
        disabled={disabled || loading}
        {...inputProps}
        autoComplete="off"
      />
    </div>
  );
}

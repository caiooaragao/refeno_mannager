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
  ...selectProps
}: FormSelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold break-words text-slate-800"
      >
        {label}
        {loading && (
          <span className="ml-2 text-xs font-normal text-slate-500">
            Carregando...
          </span>
        )}
      </label>
      <select
        id={id}
        className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-blue-700 disabled:opacity-60"
        style={{ border: "1px solid #d1dce6" }}
        disabled={disabled || loading}
        {...selectProps}
        autoComplete="off"
      >
        {children}
      </select>
    </div>
  );
}

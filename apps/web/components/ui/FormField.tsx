import { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold break-words text-slate-800"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-blue-700 disabled:opacity-60"
        style={{ border: "1px solid #d1dce6" }}
        {...inputProps}
        autoComplete="off"
      />
    </div>
  );
}

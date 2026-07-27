"use client";

import { useEffect, useState } from "react";
import {
  buildPhoneValue,
  formatLocalPhone,
  getPhoneCountry,
  parsePhoneValue,
  PHONE_COUNTRIES,
} from "@/lib/phone";

interface PhoneFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function PhoneField({
  id,
  label,
  value,
  onChange,
  placeholder = "(81) 99999-9999",
  disabled = false,
  loading = false,
}: PhoneFieldProps) {
  const parsed = parsePhoneValue(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [localDigits, setLocalDigits] = useState(parsed.localDigits);

  useEffect(() => {
    const next = parsePhoneValue(value);
    setCountryCode(next.countryCode);
    setLocalDigits(next.localDigits);
  }, [value]);

  const displayValue = formatLocalPhone(countryCode, localDigits);
  const selectedCountry = getPhoneCountry(countryCode);

  function updatePhone(nextCountryCode: string, nextLocalDigits: string) {
    setCountryCode(nextCountryCode);
    setLocalDigits(nextLocalDigits);
    onChange(buildPhoneValue(nextCountryCode, nextLocalDigits));
  }

  function handleCountryChange(nextCountryCode: string) {
    updatePhone(nextCountryCode, localDigits);
  }

  function handleLocalChange(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    const maxLength = countryCode === "BR" ? 11 : 15;
    updatePhone(countryCode, digits.slice(0, maxLength));
  }

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

      <div className="flex min-w-0">
        <div className="relative shrink-0">
          <label htmlFor={`${id}-country`} className="sr-only">
            País
          </label>
          <select
            id={`${id}-country`}
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled || loading}
            className="forest-input forest-phone-country min-w-[9.5rem] max-w-[10.5rem] appearance-none rounded-r-none border-r-0 bg-surface-container-low pr-8 pl-3 text-xs sm:min-w-[11rem] sm:max-w-none"
            title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
          >
            {PHONE_COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.flag} {item.name} ({item.dialCode})
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-on-surface-variant"
          >
            ▼
          </span>
        </div>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={displayValue}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className="forest-input rounded-l-none"
        />
      </div>
    </div>
  );
}

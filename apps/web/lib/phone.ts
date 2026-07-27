export interface PhoneCountry {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "PT", dialCode: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canadá" },
  { code: "AR", dialCode: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "CL", dialCode: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "UY", dialCode: "+598", flag: "🇺🇾", name: "Uruguai" },
  { code: "PY", dialCode: "+595", flag: "🇵🇾", name: "Paraguai" },
  { code: "BO", dialCode: "+591", flag: "🇧🇴", name: "Bolívia" },
  { code: "PE", dialCode: "+51", flag: "🇵🇪", name: "Peru" },
  { code: "CO", dialCode: "+57", flag: "🇨🇴", name: "Colômbia" },
  { code: "VE", dialCode: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "EC", dialCode: "+593", flag: "🇪🇨", name: "Equador" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", name: "México" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "Reino Unido" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "França" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: "Espanha" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Alemanha" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹", name: "Itália" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱", name: "Holanda" },
  { code: "BE", dialCode: "+32", flag: "🇧🇪", name: "Bélgica" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭", name: "Suíça" },
  { code: "SE", dialCode: "+46", flag: "🇸🇪", name: "Suécia" },
  { code: "NO", dialCode: "+47", flag: "🇳🇴", name: "Noruega" },
  { code: "DK", dialCode: "+45", flag: "🇩🇰", name: "Dinamarca" },
  { code: "FI", dialCode: "+358", flag: "🇫🇮", name: "Finlândia" },
  { code: "IE", dialCode: "+353", flag: "🇮🇪", name: "Irlanda" },
  { code: "PL", dialCode: "+48", flag: "🇵🇱", name: "Polônia" },
  { code: "RU", dialCode: "+7", flag: "🇷🇺", name: "Rússia" },
  { code: "UA", dialCode: "+380", flag: "🇺🇦", name: "Ucrânia" },
  { code: "TR", dialCode: "+90", flag: "🇹🇷", name: "Turquia" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japão" },
  { code: "CN", dialCode: "+86", flag: "🇨🇳", name: "China" },
  { code: "KR", dialCode: "+82", flag: "🇰🇷", name: "Coreia do Sul" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "Índia" },
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapura" },
  { code: "TH", dialCode: "+66", flag: "🇹🇭", name: "Tailândia" },
  { code: "VN", dialCode: "+84", flag: "🇻🇳", name: "Vietnã" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Austrália" },
  { code: "NZ", dialCode: "+64", flag: "🇳🇿", name: "Nova Zelândia" },
  { code: "ZA", dialCode: "+27", flag: "🇿🇦", name: "África do Sul" },
  { code: "EG", dialCode: "+20", flag: "🇪🇬", name: "Egito" },
  { code: "MA", dialCode: "+212", flag: "🇲🇦", name: "Marrocos" },
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "Emirados Árabes Unidos" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Arábia Saudita" },
  { code: "IL", dialCode: "+972", flag: "🇮🇱", name: "Israel" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function getPhoneCountry(code: string): PhoneCountry {
  return PHONE_COUNTRIES.find((country) => country.code === code) ?? DEFAULT_PHONE_COUNTRY;
}

function stripDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatBrazilPhone(digits: string): string {
  const numbers = stripDigits(digits).slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export function formatLocalPhone(countryCode: string, digits: string): string {
  if (countryCode === "BR") {
    return formatBrazilPhone(digits);
  }

  return stripDigits(digits);
}

export function parsePhoneValue(value: string): {
  countryCode: string;
  localDigits: string;
} {
  if (!value.trim()) {
    return {
      countryCode: DEFAULT_PHONE_COUNTRY.code,
      localDigits: "",
    };
  }

  const matchedCountry = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => value.startsWith(country.dialCode));

  if (matchedCountry) {
    const localPart = value.slice(matchedCountry.dialCode.length).trim();
    return {
      countryCode: matchedCountry.code,
      localDigits: stripDigits(localPart),
    };
  }

  return {
    countryCode: DEFAULT_PHONE_COUNTRY.code,
    localDigits: stripDigits(value),
  };
}

export function buildPhoneValue(countryCode: string, localDigits: string): string {
  const country = getPhoneCountry(countryCode);
  const digits = stripDigits(localDigits);

  if (!digits) {
    return "";
  }

  const formattedLocal = formatLocalPhone(countryCode, digits);
  return `${country.dialCode} ${formattedLocal}`;
}

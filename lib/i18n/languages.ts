export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Espanol" },
  { code: "it", label: "Italian" },
  { code: "id", label: "Indonesian" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "tr", label: "Türkçe" },
  { code: "km", label: "ភាសាខ្មែរ" },
  { code: "vi", label: "Vietnamese" },
  { code: "sq", label: "Shqiptare" },
] as const

export const rtlLanguages = ["ar"] as const

export type SupportedLanguageCode = (typeof supportedLanguages)[number]["code"]

export function isSupportedLanguage(language: string): language is SupportedLanguageCode {
  return supportedLanguages.some((item) => item.code === language)
}

export function isRtlLanguage(language: string) {
  return rtlLanguages.includes(language as (typeof rtlLanguages)[number])
}

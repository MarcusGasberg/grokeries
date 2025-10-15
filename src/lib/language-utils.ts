/**
 * Supported languages for grocery autocomplete and i18n
 */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'da'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Get normalized language code from i18next language string
 * Handles language codes like "en-US", "pt-BR", etc. and extracts the base language
 * Falls back to 'en' if the language is not supported
 *
 * @param i18nLanguage - The language code from i18next (e.g., "en-US", "da", "fr-FR")
 * @returns Normalized language code (e.g., "en", "da", "fr") with fallback to "en"
 */
export function getNormalizedLanguage(i18nLanguage: string): SupportedLanguage {
  const baseLanguage = i18nLanguage.split('-')[0].toLowerCase();

  // Check if the base language is supported
  if (SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage)) {
    return baseLanguage as SupportedLanguage;
  }

  // Fallback to English
  return 'en';
}

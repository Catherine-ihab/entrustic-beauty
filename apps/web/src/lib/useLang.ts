import { useTranslation } from 'react-i18next';

/**
 * Tiny helper – returns the current language and a bilingual helper.
 *
 * Usage:
 *   const { ar, tx } = useLang();
 *   <span>{tx('النص بالعربي', 'English text')}</span>
 */
export function useLang() {
  const { i18n } = useTranslation();
  const ar = (i18n.language || 'ar') === 'ar';
  const tx = (arText: string, enText: string) => (ar ? arText : enText);
  return { ar, tx, lang: i18n.language || 'ar' };
}

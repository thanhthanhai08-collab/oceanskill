import {defineRouting} from 'next-intl/routing';
import {defaultLocale, supportedLocales} from '@/i18n/locales';

export const routing = defineRouting({
  locales: supportedLocales,
  defaultLocale,
  localePrefix: 'always'
});

export type Locale = (typeof routing.locales)[number];

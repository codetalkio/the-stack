import { readdirSync } from 'fs';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Construct an array of all supported locales based on the files in the `messages/` directory.
const localeFiles = readdirSync(`${process.cwd()}/messages`);
const locales = localeFiles.map((f) => f.replace(/\.json$/, ''));

export default getRequestConfig(async ({ locale }: { locale: string }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

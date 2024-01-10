import '../globals.css';
import { Inter } from 'next/font/google';
import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { ReactNode } from 'react';
import { promises as fs } from 'fs';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

/**
 * Set up all supported locales as static parameters, which ensures we generate
 * static pages for each possible value of `locale`.
 */
export async function generateStaticParams() {
  // Construct an array of all supported locales based on the files in the `messages/` directory.
  const localeFiles = await fs.readdir(`${process.cwd()}/messages`);
  return localeFiles.map((f) => ({ locale: f.replace(/\.json$/, '') }));
}

type Params = {
  params: Awaited<ReturnType<typeof generateStaticParams>>[0];
};

type Props = {
  children: ReactNode;
} & Params;

/**
 * Set the metadata of the page.
 */
export async function generateMetadata({ params: { locale } }: Params) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('intro'),
    description: 'Ready to set things up',
  };
}

export default async function Layout({ children, params: { locale } }: Props) {
  // Required workaround for static rendering with next-intl.
  // https://next-intl-docs.vercel.app/docs/getting-started/app-router#static-rendering
  unstable_setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        {children}
        {process.env.IS_VERCEL_BUILD ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}

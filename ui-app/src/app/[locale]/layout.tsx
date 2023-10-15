import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { ReactNode } from 'react';
import { promises as fs } from 'fs';

export const metadata: Metadata = {
  title: "Hello, World!",
  description: "Ready to set things up",
}

const inter = Inter({ subsets: ["latin"] });

/**
 * Set up all supported locales as static parameters, which ensures we generate
 * static pages for each possible value of `locale`.
 */
export async function generateStaticParams() {
  // Construct an array of all supported locales based on the files in the `messages/` directory.
  const localeFiles = await fs.readdir(`${process.cwd()}/messages`);
  return localeFiles.map((f) => ({locale: f.replace(/\.json$/, "")}));
}

/**
 * Load the contents of a given locale's messages file.
 */
async function messagesContent(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error("Something went wrong", error);
    notFound();
  }
}

type Props = {
  children: ReactNode;
  params: {
    locale: string;
  };
};

export default async function Layout({ children, params: { locale } }: Props) {
  const messages = await messagesContent(locale);
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

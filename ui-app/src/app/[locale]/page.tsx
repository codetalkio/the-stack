import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

type Props = {
  params: { locale: string };
};

export default function Home({ params: {locale} }: Props) {
  // Required workaround for static rendering with next-intl.
  // https://next-intl-docs.vercel.app/docs/getting-started/app-router#static-rendering
  unstable_setRequestLocale(locale);

  const t = useTranslations('home');

  return (
    <div className="grid place-content-center content-center h-screen">
      <h1 className="text-6xl">{t('intro')}</h1>
      <div className="grid gap-4 grid-cols-2">
        <Link href="/fr">Go to fr</Link>
        <Link href="/en">Go to en</Link>
      </div>
    </div>
  );
}

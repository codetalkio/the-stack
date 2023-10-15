"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="grid place-content-center content-center h-screen">
      <h1 className="text-6xl">{t("intro")}</h1>
      <div className="grid gap-4 grid-cols-2">
        <Link href="/fr">Go to fr</Link>
        <Link href="/en">Go to en</Link>
      </div>
    </div>
  );
}

"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </I18nProvider>
  );
}

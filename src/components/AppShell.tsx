"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollBackdrop } from "@/components/ScrollBackdrop";
import { I18nProvider } from "@/lib/i18n";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ScrollBackdrop />
      <div className="app-frame">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </I18nProvider>
  );
}

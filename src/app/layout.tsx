import type { Metadata } from "next";
import { Cairo, Outfit } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rode Medical Centre | مجمع رود الطبي",
    template: "%s | Rode Medical Centre",
  },
  description:
    "Rode Medical Centre in Madinah — medical and aesthetic care including laser, skincare, and pediatrics. مجمع رود الشامل الطبي العام في المدينة المنورة.",
  openGraph: {
    title: "Rode Medical Centre | مجمع رود الطبي",
    description:
      "Trusted medical & aesthetic care in Madinah. Laser, skin, pediatrics, and more.",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${outfit.variable} ${cairo.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

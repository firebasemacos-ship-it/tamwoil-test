import type { Metadata } from "next";
import { Cairo } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Polyfill localStorage for SSR if needed
if (typeof window === 'undefined') {
  const noop = () => { };
  const storageMock = {
    getItem: () => null,
    setItem: noop,
    removeItem: noop,
    clear: noop,
    length: 0,
    key: () => null,
  };

  try {
    if (typeof global.localStorage === 'undefined' || typeof global.localStorage.getItem !== 'function') {
      Object.defineProperty(global, 'localStorage', {
        value: storageMock,
        writable: true,
        configurable: true
      });
    }
  } catch (e) {
    console.error('Failed to polyfill localStorage:', e);
  }
}


const cairo = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: "تمويل | Tamwoil",
  description: "نظام تمويل لإدارة الشحنات والعملاء",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        {/* Next.js will automatically handle the favicon if it's placed in the app directory. */}
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

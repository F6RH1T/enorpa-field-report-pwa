import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ENORPA Dijital Saha Raporu',
  description: 'Saha ziyaretlerini fotoğraflı rapora dönüştürün, PDF alın ve paylaşın.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'ENORPA Dijital Saha Raporu',
    description: 'Sahadan rapora, tek akışta.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ENORPA Dijital Saha Raporu',
    description: 'Sahadan rapora, tek akışta.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

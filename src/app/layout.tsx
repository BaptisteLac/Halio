import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import PWAInstallPrompt from '@/components/layout/PWAInstallPrompt';
import ServiceWorkerRegistration from '@/components/layout/ServiceWorkerRegistration';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://halioapp.com'),
  title: 'Halioapp',
  description: 'Décidez quand et où pêcher sur le Bassin d\'Arcachon',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Halioapp',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Halioapp',
    description: 'Décidez quand et où pêcher sur le Bassin d\'Arcachon',
    url: '/',
    siteName: 'Halioapp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-dvh`}>
        {children}
        <PWAInstallPrompt />
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}

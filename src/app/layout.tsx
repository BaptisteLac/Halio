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
  title: 'PêcheBoard — Bassin d\'Arcachon',
  description: 'Tableau de bord pour pêcheurs en bateau sur le Bassin d\'Arcachon. Marées, météo, scores de pêche et spots.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PêcheBoard',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen`}>
        {children}
        <PWAInstallPrompt />
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import PWAInstallPrompt from '@/components/layout/PWAInstallPrompt';
import ServiceWorkerRegistration from '@/components/layout/ServiceWorkerRegistration';
import PostHogProvider from '@/app/providers/PostHogProvider';
import AppFabs from '@/components/layout/AppFabs';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
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
  themeColor: 'oklch(7% .012 230)',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} font-sans antialiased min-h-dvh`} style={{ background: 'oklch(7% .012 230)', color: '#ffffff' }}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <AppFabs />
        <PWAInstallPrompt />
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}

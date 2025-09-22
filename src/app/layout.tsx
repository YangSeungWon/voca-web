import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import MobileLayout from '@/components/MobileLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vocabulary - Simple Word Learning',
  description: 'A minimal vocabulary learning app',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1f2937',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <MobileLayout>
            {children}
          </MobileLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
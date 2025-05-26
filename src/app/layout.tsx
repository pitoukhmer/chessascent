import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from "@/components/ui/toaster";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'Chess Ascent',
  description: 'Master chess with AI-powered learning and intuitive gameplay.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} flex flex-col min-h-screen`}>
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Chess Ascent. All rights reserved.
        </footer>
        <Toaster />
      </body>
    </html>
  );
}

// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AppErrorBoundary } from '@/components/common/ErrorBoundary';

// Font configurations
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Expense Tracker - Smart Financial Management",
    template: "%s | Expense Tracker"
  },
  description: "Track your expenses, manage budgets, and take control of your financial future with our smart expense tracking application.",
  keywords: ['expense tracker', 'budget management', 'financial planning', 'money management'],
  authors: [{ name: 'Expense Tracker Team' }],
  creator: 'Expense Tracker',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Expense Tracker - Smart Financial Management',
    description: 'Track your expenses, manage budgets, and take control of your financial future.',
    siteName: 'Expense Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker - Smart Financial Management',
    description: 'Track your expenses, manage budgets, and take control of your financial future.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Additional meta tags for better performance */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Expense Tracker" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppErrorBoundary>
            {/* Skip to main content for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded-md z-50 transition-all"
            >
              Skip to main content
            </a>
            
            {/* Main application content */}
            <div id="main-content" className="relative">
              {children}
            </div>
            
            {/* Toast notifications */}
            <Toaster />
          </AppErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
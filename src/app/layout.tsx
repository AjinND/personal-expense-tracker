// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// Conditional imports for debug components
const ApiStatusIndicator = process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true' 
  ? require('@/components/dev/ApiStatusIndicator').default 
  : null;

const DebugHelper = process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true'
  ? require('@/components/dev/DebugHelper').default 
  : null;

// Font configurations using your existing setup
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
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebugEnabled = process.env.DEBUG === 'true';
  const showDebugComponents = isDevelopment && isDebugEnabled;

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
          
          {/* Development and Debug Components */}
          {showDebugComponents && (
            <>
              {ApiStatusIndicator && <ApiStatusIndicator position="bottom-right" />}
              {DebugHelper && <DebugHelper />}
            </>
          )}

          {/* Development-only indicators */}
          {isDevelopment && !isDebugEnabled && (
            <div className="fixed bottom-4 left-4 z-50">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded text-xs">
                <p className="font-semibold">Development Mode</p>
                <p>Set DEBUG=true to enable debug tools</p>
              </div>
            </div>
          )}
        </ThemeProvider>

        {/* Service Worker registration (only in production) */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AppProvider } from '@/contexts/AppContext'
import SessionProvider from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: '🌟 Astral Money - Ultimate Budget Tracker 2025',
  description: 'Professional budget tracking with AI-powered insights, real-time financial health scoring, and smart bill management. Track expenses, manage income, and achieve your financial goals.',
  keywords: 'budget tracker, expense management, financial health, bill tracking, money management, personal finance, savings goals',
  authors: [{ name: 'Astral Money Team' }],
  creator: 'Astral Money',
  publisher: 'Astral Money',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://astral-money.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '🌟 Astral Money - Ultimate Budget Tracker 2025',
    description: 'Professional budget tracking with AI-powered insights, real-time financial health scoring, and smart bill management.',
    url: 'https://astral-money.vercel.app',
    siteName: 'Astral Money',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Astral Money - Budget Tracker Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🌟 Astral Money - Ultimate Budget Tracker 2025',
    description: 'Professional budget tracking with AI-powered insights and real-time financial health scoring.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

/**
 * Root layout component that provides the base HTML structure and global providers
 * Includes performance optimizations, SEO meta tags, and error boundaries
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Astral Money" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              window.astralPerf = {
                marks: {},
                mark: function(name) {
                  this.marks[name] = performance.now();
                  performance.mark(name);
                },
                measure: function(name, start, end) {
                  performance.measure(name, start, end);
                  return performance.getEntriesByName(name, 'measure')[0]?.duration || 0;
                }
              };
              window.astralPerf.mark('layout-start');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen antialiased`}>
        <ErrorBoundary>
          <SessionProvider>
            <AppProvider>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600"></div>
                </div>
              }>
                {children}
              </Suspense>
            </AppProvider>
          </SessionProvider>
        </ErrorBoundary>
        <div id="modal-root"></div>
        <div id="tooltip-root"></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.astralPerf.mark('layout-end');
              window.astralPerf.measure('layout-duration', 'layout-start', 'layout-end');
            `,
          }}
        />
      </body>
    </html>
  )
}
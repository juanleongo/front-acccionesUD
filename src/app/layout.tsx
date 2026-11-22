import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Acciones UD | Simulación bursátil en Wall Street',
  description:
    'Plataforma de simulación bursátil y aprendizaje en mercados estadounidenses de la Universidad Distrital Francisco José de Caldas.',
  icons: {
    icon: [
      { url: '/logo-acciones-ud.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/logo-acciones-ud.png',
    apple: '/logo-acciones-ud.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0c0e13' },
    { media: '(prefers-color-scheme: light)', color: '#f1f5f9' },
  ],
};

const BOOTSTRAP_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('acciones_ud_theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}var l=localStorage.getItem('acciones_ud_locale');if(l==='es'||l==='en'){document.documentElement.lang=l;document.documentElement.dataset.locale=l;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

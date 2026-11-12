import type { Metadata } from 'next';
import Script from 'next/script';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('acciones_ud_theme')==='light'){document.documentElement.dataset.theme='light'}}catch{}",
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Acciones UD | Mercados globales y simulación bursátil',
  description:
    'Conoce Acciones UD: explora mercados globales y descubre la próxima plataforma de simulación bursátil.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
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

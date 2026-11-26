'use client';
import { useState } from 'react';
import Image from 'next/image';
import styles from './asset-logo.module.css';

// These existing assets belong to the exact underlying company, never its ETFs.
const localLogos: Record<string, string> = {
  AAPL: 'apple.svg',
  NVDA: 'nvidia.svg',
  TSLA: 'tesla.svg',
  SPY: 'spdr.ico',
  JPM: 'jpmorgan.png',
  XOM: 'exxonmobil.png',
};
function LogoImage({
  symbol,
  exchange,
  size,
}: {
  symbol: string;
  exchange: string;
  size: 'sm' | 'md';
}) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Only supported exchange prefixes; all instruments in our catalog are US listings.
  const prefix = (
    { NASDAQ: 'NASDAQ', NYSE: 'NYSE', ARCA: 'NYSE', BATS: 'CBOE' } as Record<
      string,
      string
    >
  )[exchange];
  const ticker = prefix ? `${prefix}:${symbol}` : symbol;
  const sources = [
    ...(localLogos[symbol] ? [`/brands/${localLogos[symbol]}`] : []),
    `https://logoapi.sh/ticker/${encodeURIComponent(ticker)}.svg?shape=square&fallback=404`,
    `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`,
    `/api/v1/public/instruments/${encodeURIComponent(symbol)}/logo`,
  ];
  const source = sources[attempt];
  return (
    <span
      className={styles.logo}
      data-size={size}
      data-fallback={!loaded}
      data-loaded={loaded}
      data-contrast={
        symbol === 'AAA' &&
        source?.startsWith('https://financialmodelingprep.com/')
          ? 'dark'
          : 'normal'
      }
      aria-hidden="true"
    >
      {!loaded && symbol.slice(0, 2)}
      {source && (
        <Image
          key={source}
          src={source}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          unoptimized
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setAttempt((index) => Math.min(index + 1, sources.length));
          }}
        />
      )}
    </span>
  );
}

export function AssetLogo({
  symbol,
  exchange = '',
  size = 'md',
}: {
  symbol: string;
  exchange?: string;
  size?: 'sm' | 'md';
}) {
  const normalized = symbol.trim().toUpperCase();
  return (
    <LogoImage
      key={`${normalized}:${exchange}`}
      symbol={normalized}
      exchange={exchange}
      size={size}
    />
  );
}

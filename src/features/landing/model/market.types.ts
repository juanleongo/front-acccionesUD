/** Modelo de presentación de activos estadounidenses en la portada. */
export type Exchange = 'NASDAQ' | 'NYSE' | 'ARCA';

export interface MarketAsset {
  symbol: string;
  name: string;
  exchange: Exchange;
  emblem: string;
  priceLabel: string;
  currency: 'USD';
  changeLabel: string;
  status: 'open' | 'closed';
}

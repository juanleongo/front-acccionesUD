/** Modelo de presentación. No representa un DTO ni un contrato del backend. */
export type Exchange = 'NASDAQ' | 'LSE' | 'TSE' | 'ASX';

export interface MarketAsset {
  symbol: string;
  name: string;
  exchange: Exchange;
  emblem: string;
  priceLabel: string;
  currency: string;
  changeLabel: string;
  status: 'open' | 'closed';
}

import type { Locale } from '@/lib/i18n/locale';
import type { Theme } from '@/lib/theme';

/** Official hosted widget: public display only; no account or API credentials. */
export type MarketView = 'screener' | 'chart';

export function tradingViewWidgetUrl(
  locale: Locale,
  theme: Theme,
  origin: string,
  view: MarketView,
): string {
  const url = new URL(
    `https://www.tradingview-widget.com/embed-widget/${view === 'chart' ? 'advanced-chart' : 'screener'}/`,
  );
  url.searchParams.set('locale', locale);
  url.hash = encodeURIComponent(
    JSON.stringify({
      ...(view === 'chart'
        ? {
            symbol: 'NASDAQ:AAPL',
            interval: 'D',
            timezone: 'America/New_York',
            theme,
            style: '1',
            allow_symbol_change: true,
            hide_side_toolbar: false,
          }
        : {
            market: 'america',
            defaultColumn: 'overview',
            defaultScreen: 'most_capitalized',
            showToolbar: true,
            isTransparent: false,
            colorTheme: theme,
          }),
      width: '100%',
      height: '100%',
      largeChartUrl: new URL('/login', origin).href,
    }),
  );
  return url.href;
}

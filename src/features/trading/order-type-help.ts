import { tx, type Locale } from '@/lib/i18n/locale';
import type { OrderInput } from './trading-api';

export function getOrderTypeHelp(
  type: OrderInput['type'],
  side: OrderInput['side'],
  locale: Locale,
) {
  switch (type) {
    case 'market':
      return tx(
        locale,
        'Mercado: intenta ejecutar al mejor precio disponible. El precio de referencia es orientativo y puede cambiar al ejecutarse.',
        'Market: attempts to execute at the best available price. The reference price is indicative and may change at execution.',
      );
    case 'limit':
      return side === 'buy'
        ? tx(
            locale,
            'Límite: indica el precio máximo que pagarías por cada acción, no el total de la compra. Solo puede ejecutarse a ese precio o menos y podría no ejecutarse.',
            'Limit: set the maximum price per share, not your total budget. It can only fill at that price or lower and may not fill.',
          )
        : tx(
            locale,
            'Límite: indica el precio mínimo que aceptarías por cada acción. Solo puede ejecutarse a ese precio o más y podría no ejecutarse.',
            'Limit: set the minimum price per share you would accept. It can only fill at that price or higher and may not fill.',
          );
    case 'stop':
      return tx(
        locale,
        'Stop: el precio indicado activa una orden de mercado. Es un disparador, no un precio de ejecución garantizado.',
        'Stop: the specified price triggers a market order. It is a trigger, not a guaranteed execution price.',
      );
    case 'stop_limit':
      return tx(
        locale,
        'Stop-limit: el stop activa la orden y el límite establece el precio máximo de compra o mínimo de venta. Si no se cumple el límite, puede no ejecutarse.',
        'Stop-limit: the stop triggers the order and the limit sets the maximum buy or minimum sell price. The order may not fill if the limit cannot be met.',
      );
    case 'trailing_stop':
      return tx(
        locale,
        'Trailing stop: el disparador sigue los movimientos favorables del precio a la distancia indicada en USD o porcentaje. Al activarse envía una orden de mercado, sin garantizar un precio.',
        'Trailing stop: the trigger follows favorable price moves at the specified USD or percentage distance. When triggered it sends a market order without guaranteeing a price.',
      );
  }
}

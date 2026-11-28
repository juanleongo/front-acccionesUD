import 'client-only';
import { createFetchTransport } from './fetch-transport';
import { withSessionRefresh } from './session-refresh';

export const browserHttp = withSessionRefresh(
  createFetchTransport({
    credentials: 'same-origin',
    notifyUnauthorized: false,
  }),
);

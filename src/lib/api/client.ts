import 'client-only';
import { createFetchTransport } from './fetch-transport';

export const browserHttp = createFetchTransport({ credentials: 'same-origin' });

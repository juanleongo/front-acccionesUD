import { setupServer } from 'msw/node';

// Infrastructure responses are declared per test. No business fixtures or real endpoints.
export const mockServer = setupServer();

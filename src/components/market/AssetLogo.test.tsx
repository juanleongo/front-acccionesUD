// @vitest-environment jsdom
import { render, fireEvent, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AssetLogo } from './AssetLogo';

it('loads external logos and recovers from a missing provider without a broken image or retry loop', () => {
  const { container } = render(<AssetLogo symbol="MSFT" exchange="NASDAQ" />);
  const image = () => container.querySelector('img')!;
  expect(image().getAttribute('src')).toContain(
    'logoapi.sh/ticker/NASDAQ%3AMSFT.svg',
  );
  expect(container.textContent).toBe('MS'); // Useful placeholder while the request is pending.
  fireEvent.error(image());
  expect(image().src).toBe(
    'https://financialmodelingprep.com/image-stock/MSFT.png',
  );
  fireEvent.error(image());
  expect(new URL(image().src).pathname).toBe(
    '/api/v1/public/instruments/MSFT/logo',
  );
  fireEvent.error(image());
  expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toBe('MS');
});

it('recovers from a broken local logo through the external service and shows it after loading', async () => {
  const { container } = render(<AssetLogo symbol="NVDA" exchange="NASDAQ" />);
  expect(new URL(container.querySelector('img')!.src).pathname).toBe(
    '/brands/nvidia.svg',
  );
  fireEvent.error(container.querySelector('img')!);
  expect(container.querySelector('img')!.getAttribute('src')).toContain(
    'logoapi.sh/ticker/NASDAQ%3ANVDA.svg',
  );
  fireEvent.load(container.querySelector('img')!);
  await waitFor(() =>
    expect(container.querySelector('[data-loaded="true"]')).not.toBeNull(),
  );
  expect(container.textContent).toBe('');
});

it('resets failed image attempts when a row is reused for another company or exchange', () => {
  const { container, rerender } = render(
    <AssetLogo symbol="MSFT" exchange="NASDAQ" />,
  );
  fireEvent.error(container.querySelector('img')!);
  fireEvent.error(container.querySelector('img')!);
  fireEvent.error(container.querySelector('img')!);
  expect(container.querySelector('img')).toBeNull();
  rerender(<AssetLogo symbol="IBM" exchange="NYSE" />);
  expect(container.querySelector('img')!.getAttribute('src')).toContain(
    'NYSE%3AIBM.svg',
  );
  fireEvent.load(container.querySelector('img')!);
  rerender(<AssetLogo symbol="MSFT" exchange="NASDAQ" />);
  expect(container.querySelector('img')!.getAttribute('src')).toContain(
    'NASDAQ%3AMSFT.svg',
  );
  expect(container.querySelector('[data-loaded="false"]')).not.toBeNull();
});

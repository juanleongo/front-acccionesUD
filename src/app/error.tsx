'use client';

import { RouteFallback } from './RouteFallback';

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteFallback kind="error" onRetry={reset} />;
}

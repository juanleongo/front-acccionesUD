/** Technical contracts only. No agreed wire messages or automatic connections. */
export const REALTIME_PATH = '/ws/v1' as const;

export interface RealtimeScope {
  sessionEpoch: string;
  accountId: string;
}

export type Unsubscribe = () => void;

/** Implement once the backend defines the subscription protocol and event schemas. */
export interface RealtimePort<TSubscription, TEvent> {
  connect(scope: RealtimeScope, signal: AbortSignal): Promise<void>;
  subscribe(
    subscription: TSubscription,
    onEvent: (event: TEvent) => void,
  ): Unsubscribe;
  disconnect(): void;
}

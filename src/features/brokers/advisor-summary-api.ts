'use client';
import { brokerRequest } from './brokers-api';
import { linkSchema, pageSchema } from './brokers-schemas';
import type { BrokerLinkRecord } from './brokers-types';
export function latestActiveLink(
  links: BrokerLinkRecord[],
): BrokerLinkRecord | null {
  return (
    links
      .filter((link) => link.status === 'active')
      .sort(
        (a, b) =>
          Date.parse(b.started_at ?? b.responded_at ?? b.requested_at) -
          Date.parse(a.started_at ?? a.responded_at ?? a.requested_at),
      )[0] ?? null
  );
}
export async function fetchLatestActiveLink(signal: AbortSignal) {
  const links: BrokerLinkRecord[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const page: { items: BrokerLinkRecord[]; next_cursor: string | null } =
      await brokerRequest(
        'broker-links',
        pageSchema(linkSchema),
        'GET',
        undefined,
        { status: 'active', page_size: '100', ...(cursor ? { cursor } : {}) },
        signal,
      );
    links.push(...page.items);
    cursor = page.next_cursor;
    if (cursor && seen.has(cursor))
      throw new Error('Repeated pagination cursor');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return latestActiveLink(links);
}

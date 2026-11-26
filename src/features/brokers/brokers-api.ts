'use client';
import { z } from 'zod';
import { browserHttp } from '@/lib/api/client';
import * as s from './brokers-schemas';
import type { ProposalItem } from './brokers-types';
export type BrokerRole = 'investor' | 'broker';
export type Filters = Record<string, string>;
export function brokerRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: unknown,
  query?: Filters,
  signal?: AbortSignal,
): Promise<T> {
  return browserHttp.request({
    path: `/api/v1/${path}`,
    method,
    response: 'json',
    parse: schema.parse,
    ...(body === undefined ? {} : { body }),
    ...(query ? { query } : {}),
    ...(signal ? { signal } : {}),
    timeoutMs: 30000,
  });
}
export const proposalPath = (role: BrokerRole) =>
  role === 'broker' ? 'broker/proposals' : 'proposals';
export const fetchBrokersDirectory = (
  filters: Filters = {},
  signal?: AbortSignal,
) =>
  brokerRequest(
    'brokers',
    s.pageSchema(s.brokerSchema),
    'GET',
    undefined,
    { page_size: '10', ...filters },
    signal,
  );
export const fetchCurrentBrokerLink = (signal?: AbortSignal) =>
  brokerRequest(
    'broker-links/current',
    s.currentLinkSchema,
    'GET',
    undefined,
    undefined,
    signal,
  );
export const fetchBrokerLinkRequests = (signal?: AbortSignal) =>
  brokerRequest(
    'broker/link-requests',
    z.array(s.requestSchema),
    'GET',
    undefined,
    undefined,
    signal,
  );
export const fetchBrokerClients = (signal?: AbortSignal) =>
  brokerRequest(
    'broker/clients',
    z.array(s.clientSchema),
    'GET',
    undefined,
    undefined,
    signal,
  );
export const fetchProposals = (
  role: BrokerRole,
  filters: Filters = {},
  signal?: AbortSignal,
) =>
  brokerRequest(
    proposalPath(role),
    s.pageSchema(s.proposalSchema),
    'GET',
    undefined,
    { page_size: '10', ...filters },
    signal,
  );
export const fetchMessages = (
  role: BrokerRole,
  id: string,
  filters: Filters = {},
  signal?: AbortSignal,
) =>
  brokerRequest(
    `${proposalPath(role)}/${id}/messages`,
    s.pageSchema(s.messageSchema),
    'GET',
    undefined,
    { page_size: '100', ...filters },
    signal,
  );
export const fetchProposalDetail = (
  role: BrokerRole,
  id: string,
  signal?: AbortSignal,
) =>
  brokerRequest(
    `${proposalPath(role)}/${id}`,
    s.proposalDetailSchema,
    'GET',
    undefined,
    undefined,
    signal,
  );
export function proposalView(
  detail: z.infer<typeof s.proposalDetailSchema>,
): ProposalItem {
  const version = detail.versions.find(
    (v) => v.version === detail.current_version,
  );
  if (!version) throw new Error('PROPOSAL_VERSION_MISSING');
  return { ...detail, ...version, id: detail.id };
}
export const decideProposal = (
  id: string,
  version: number,
  decision: 'accept' | 'reject',
  comment: string,
  totp: string,
) =>
  brokerRequest(`proposals/${id}/decision`, s.proposalDetailSchema, 'POST', {
    version,
    decision,
    comment,
    ...(decision === 'accept' ? { totp_code: totp } : {}),
  });
export const sendProposalMessage = (
  role: BrokerRole,
  id: string,
  body: string,
) =>
  brokerRequest(
    `${proposalPath(role)}/${id}/messages`,
    s.messageSchema,
    'POST',
    { body },
  );
export const saveBrokerProfile = (body: s.ProfileInput) =>
  brokerRequest(
    'brokers/me/profile',
    s.brokerSchema,
    'PUT',
    s.profileInput.parse(body),
  );

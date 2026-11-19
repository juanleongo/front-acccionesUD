'use client';

/**
 * Plantilla de contratos e integración API — Módulo 06 (Comisionistas, Vínculos, Propuestas y Portal Broker).
 *
 * NOTA PARA EL INTEGRADOR DE APIs:
 * Las vistas de `BrokersHub.tsx` están completamente maquetadas y operan
 * sobre los datos de diseño de `brokers-mock.ts`.
 * Conecta cada función inferior usando `browserHttp.request` de `@/lib/api/client`.
 */

import {
  INITIAL_BROKER_CLIENTS,
  INITIAL_BROKER_REQUESTS,
  INITIAL_BROKERS_DIRECTORY,
  INITIAL_CURRENT_LINK,
  INITIAL_PROPOSALS,
  type BrokerClientItem,
  type BrokerDirectoryItem,
  type BrokerPendingRequest,
  type CurrentBrokerLinkData,
  type ProposalItem,
} from './brokers-mock';

export async function fetchBrokersDirectory(): Promise<BrokerDirectoryItem[]> {
  // TODO(integración-api): Conectar con GET /api/v1/brokers?q= y GET /api/v1/brokers/suggestions
  return INITIAL_BROKERS_DIRECTORY;
}

export async function fetchCurrentBrokerLink(): Promise<CurrentBrokerLinkData> {
  // TODO(integración-api): Conectar con GET /api/v1/broker-links/current
  return INITIAL_CURRENT_LINK;
}

export async function fetchInvestorProposals(): Promise<ProposalItem[]> {
  // TODO(integración-api): Conectar con GET /api/v1/proposals
  return INITIAL_PROPOSALS;
}

export async function fetchBrokerLinkRequests(): Promise<
  BrokerPendingRequest[]
> {
  // TODO(integración-api): Conectar con GET /api/v1/broker/link-requests
  return INITIAL_BROKER_REQUESTS;
}

export async function fetchBrokerClients(): Promise<BrokerClientItem[]> {
  // TODO(integración-api): Conectar con GET /api/v1/broker/clients
  return INITIAL_BROKER_CLIENTS;
}

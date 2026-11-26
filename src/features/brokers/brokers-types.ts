export interface BrokerReputation {
  broker_id: string;
  name: string;
  average: string | number | null;
  reviews_count: number;
  converted_proposals: number;
  distinct_investors: number;
  years_experience: number;
  broker_since: string;
}

export interface BrokerDirectoryItem {
  id: string;
  name: string;
  firm_name: string;
  specialty: string;
  years_experience: number;
  certifications: string[];
  description?: string | undefined;
  avatarUrl?: string | undefined;
  reputation: BrokerReputation;
}

export interface BrokerReviewItem {
  stars: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerLinkRecord {
  id: string;
  investor_id: string;
  broker_id: string;
  broker: {
    id: string;
    name: string;
    firm_name: string;
  };
  status:
    'requested' | 'active' | 'declined' | 'canceled' | 'expired' | 'ended';
  requested_at: string;
  expires_at: string;
  responded_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  decline_reason: string | null;
  end_reason: string | null;
  consent_version: string;
  consent_accepted_at: string;
  order_review_enabled: boolean;
}

export interface TradingAuthorizationRecord {
  id: string;
  link_id: string;
  consent_version: string;
  granted_at: string;
  revoked_at: string | null;
  revoke_reason: 'investor' | 'link_ended' | null;
}

export interface CurrentBrokerLinkData {
  link: BrokerLinkRecord | null;
  trading_authorization: TradingAuthorizationRecord | null;
  pending_broker_selection: boolean;
  suggestions: BrokerDirectoryItem[];
}

export interface ProposalItem {
  id: string;
  link_id: string;
  status:
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'withdrawn'
    | 'approved'
    | 'declined_by_broker'
    | 'conversion_failed'
    | 'expired';
  status_reason: string | null;
  current_version: number;
  accepted_version: number | null;
  order_id: string | null;
  failure_code: string | null;
  broker: { id: string; name: string };
  investor: { id: string; name: string };
  symbol: string;
  side: 'buy' | 'sell';
  qty: string;
  type: 'market' | 'limit';
  limit_price?: string | null | undefined;
  estimated_cost: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ProposalChatMessage {
  id: string;
  proposal_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface BrokerPendingRequest {
  id: string;
  investor_id: string;
  investor_name: string;
  requested_at: string;
}

export interface BrokerClientItem {
  investor_id: string;
  name: string;
  link_id: string;
  since: string;
  trading_authorized: boolean;
  order_review_enabled: boolean;
}

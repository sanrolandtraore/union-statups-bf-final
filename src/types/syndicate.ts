import type { Json } from "@/integrations/supabase/types";

export interface Syndicate {
  id: string;
  lead_investor_id: string;
  name: string;
  description: string | null;
  thesis: string | null;
  min_ticket: number;
  carry_percentage: number;
  management_fee_percentage: number | null;
  vehicle_duration_months: number | null;
  target_size: number | null;
  status: string;
  is_private: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyndicateMember {
  id: string;
  syndicate_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_email: string | null;
  kyc_status: string;
  nda_signed: boolean;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  syndicate_id: string;
  startup_name: string | null;
  title: string;
  description: string | null;
  sector: string | null;
  stage: string | null;
  target_amount: number;
  raised_amount: number;
  min_commitment: number;
  valuation: number | null;
  equity_percentage: number | null;
  deadline: string | null;
  status: string;
  pitch_deck_url: string | null;
  term_sheet_url: string | null;
  kpi_data: Record<string, Json>;
  cap_table: Json[];
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commitment {
  id: string;
  deal_id: string;
  member_id: string;
  user_id: string;
  amount: number;
  status: string;
  signed_at: string | null;
  contract_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealQuestion {
  id: string;
  deal_id: string;
  asked_by: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;
  is_public: boolean;
  created_at: string;
}

export interface SyndicateTransaction {
  id: string;
  commitment_id: string | null;
  deal_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_provider: string | null;
  status: string;
  reference: string | null;
  metadata: Record<string, Json>;
  created_at: string;
  updated_at: string;
}

export const formatCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);

export const dealStatusLabels: Record<string, string> = {
  open: "Ouvert",
  funded: "Financé",
  closed: "Clôturé",
  cancelled: "Annulé",
};

export const commitmentStatusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Complété",
  cancelled: "Annulé",
};

export const kycStatusLabels: Record<string, string> = {
  pending: "En attente",
  submitted: "Soumis",
  verified: "Vérifié",
  rejected: "Rejeté",
};

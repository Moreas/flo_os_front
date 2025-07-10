export interface EmailMessage {
  id: number;
  message_id: string;
  sender_name: string;
  subject: string;
  sender: string;
  recipients: string;
  body: string;
  thread_id: string;
  received_at: string;
  sent_at?: string | null;
  is_outgoing: boolean;
  is_handled: boolean;
  draft_reply: string;
  needs_reply: boolean;
  category?: {
    id: number;
    name: string;
  } | null;
  person?: {
    id: number;
    name: string;
    relationship?: string;
  } | null;
  business?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  project?: {
    id: number;
    name: string;
    status: string;
    type: string;
  } | null;
  category_name?: string | null;
  auto_categories?: string[];
  auto_category_reason?: string;
  needs_internal_handling: boolean;
  waiting_external_handling: boolean;
  internal_handling_notes: string;
  external_handling_notes: string;
} 
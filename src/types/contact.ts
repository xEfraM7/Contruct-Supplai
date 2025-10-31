export interface Contact {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  phone: string;
  email: string | null;
  position: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

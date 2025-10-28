export interface Client {
  id: string;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  address: string | null;
  website: string | null;
  status: string;
  subcontractors_count: number;
  created_at: string;
}

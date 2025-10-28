export interface Equipment {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  tag: string;
  category: string;
  status: "available" | "checked_out" | "maintenance";
  location: string | null;
  next_maintenance: string | null;
  last_maintenance: string | null;
  maintenance_interval_days: number;
  value: number;
  quantity: number;
  purchase_date: string | null;
  assigned_to: string | null;
  checked_out_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

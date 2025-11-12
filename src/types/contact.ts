export type ContactRole = 
  | 'project_manager'
  | 'estimator'
  | 'field_worker'
  | 'supervisor'
  | 'foreman'
  | 'engineer'
  | 'contractor'
  | 'other';

export interface ContactSkill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Contact {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  phone: string;
  email: string | null;
  role: ContactRole | null;
  skills: ContactSkill[];
  hourly_rate: number | null;
  hire_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactTask {
  id: string;
  contact_id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContactWorkload {
  contact_id: string;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  total_hours: number;
  utilization_rate: number;
}

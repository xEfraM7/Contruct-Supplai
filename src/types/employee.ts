export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone: string;
  status?: 'active' | 'inactive' | 'on_leave';
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeWithProjects extends Employee {
  active_projects?: number;
  total_projects?: number;
  clients?: string[];
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    clients?: {
      company_name: string;
    };
  }>;
}

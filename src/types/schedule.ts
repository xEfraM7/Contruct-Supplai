export interface ConstructionEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date: string;
  type: "meeting" | "inspection" | "delivery" | "milestone" | "maintenance" | "safety";
  priority: "low" | "medium" | "high" | "critical";
  location: string;
  assigned_to?: string[];
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  project_id?: string;
}

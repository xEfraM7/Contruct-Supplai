import { type ConstructionEvent } from "@/lib/actions/schedule-actions";

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  type: ConstructionEvent["type"];
  priority: ConstructionEvent["priority"];
  location: string;
  assigned_to: string;
  project_id: string;
}

export interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}

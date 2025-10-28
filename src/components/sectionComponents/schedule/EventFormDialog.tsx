"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { type ConstructionEvent } from "@/lib/actions/schedule-actions";

interface EventFormData {
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

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}

export function EventFormDialog({
  open,
  onOpenChange,
  title,
  formData,
  setFormData,
  onSubmit,
  isPending,
  submitLabel,
}: EventFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Foundation Inspection"
            />
          </div>
          <div>
            <Label htmlFor="type">Event Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ConstructionEvent["type"]) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="date">Start Date *</Label>
              <DateInput
                id="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    date: e.target.value,
                    end_date: prev.end_date || e.target.value,
                  }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <DateInput
                id="end_date"
                value={formData.end_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: ConstructionEvent["priority"]) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Main Site - Sector A"
            />
          </div>
          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData((prev) => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="e.g., John Doe, Jane Smith (comma separated)"
            />
          </div>
          <div>
            <Label htmlFor="project_id">Project ID</Label>
            <Input
              id="project_id"
              value={formData.project_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, project_id: e.target.value }))}
              placeholder="e.g., PROJ-001"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Event details..."
            />
          </div>
          <Button className="w-full" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

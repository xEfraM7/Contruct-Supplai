"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedEndDate, setEstimatedEndDate] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !clientName.trim() || !projectAddress.trim()) {
      setError("Please fill in required fields (Project Name, Client Name, Project Address)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          client_name: clientName,
          address: projectAddress,
          client_phone: clientPhone,
          client_email: clientEmail,
          start_date: startDate,
          estimated_end_date: estimatedEndDate,
          estimated_budget: estimatedBudget,
          description: projectDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      // Reset form
      setProjectName("");
      setClientName("");
      setProjectAddress("");
      setClientPhone("");
      setClientEmail("");
      setStartDate("");
      setEstimatedEndDate("");
      setEstimatedBudget("");
      setProjectDescription("");
      onOpenChange(false);

      // Notify parent component
      if (onProjectCreated) {
        onProjectCreated();
      }

      // Redirect to blueprints with the new project ID
      if (data.project?.id) {
        router.push(`/blueprints/${data.project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Name */}
              <div className="grid gap-2">
                <Label htmlFor="projectName">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Client Name */}
              <div className="grid gap-2">
                <Label htmlFor="clientName">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Project Address */}
            <div className="grid gap-2">
              <Label htmlFor="projectAddress">
                Project Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectAddress"
                placeholder="Enter project address"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Phone */}
              <div className="grid gap-2">
                <Label htmlFor="clientPhone">Client Phone</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  placeholder="Enter client phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Client Email */}
              <div className="grid gap-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="Enter client email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DateInput
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Estimated End Date */}
              <div className="grid gap-2">
                <Label htmlFor="estimatedEndDate">Estimated End Date</Label>
                <DateInput
                  id="estimatedEndDate"
                  value={estimatedEndDate}
                  onChange={(e) => setEstimatedEndDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Estimated Budget */}
            <div className="grid gap-2">
              <Label htmlFor="estimatedBudget">Estimated Budget</Label>
              <Input
                id="estimatedBudget"
                type="number"
                placeholder="Enter budget"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Project Description */}
            <div className="grid gap-2">
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                placeholder="Enter project description"
                rows={4}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

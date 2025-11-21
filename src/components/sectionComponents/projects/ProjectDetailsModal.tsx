"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea, FormDateInput, FormSelect } from "@/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  User,
  Calendar,
  MapPin,
  FileText,
  ArrowRight,
  Clock,
  Edit,
  Save,
  X,
} from "lucide-react";
import { ProjectWithDetails } from "@/types/project";
import { formatDate, getDateStatus } from "@/lib/utils/dateUtils";
import { projectSchema, type ProjectFormData } from "@/lib/validations/project";
import { useUpdateProject } from "@/lib/hooks/use-projects";
import { useClients } from "@/lib/hooks/use-clients";
import { useEmployees } from "@/lib/hooks/use-employees";

interface ProjectDetailsModalProps {
  project: ProjectWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculateProgress: (project: ProjectWithDetails) => number;
  getStatusColor: (status?: string) => string;
}

// Helper function to format status text
const formatStatusText = (status?: string): string => {
  if (!status) return "Active";
  
  const statusMap: Record<string, string> = {
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
    planning: "Planning",
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

export function ProjectDetailsModal({
  project,
  open,
  onOpenChange,
  getStatusColor,
}: ProjectDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateProject = useUpdateProject();
  const { data: clients = [] } = useClients();
  const { data: employees = [] } = useEmployees();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Update form values when project changes
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        address: project.address,
        description: project.description || "",
        client_id: project.client_id,
        employee_manager_id: project.employee_manager_id || "",
        start_date: project.startDate || "",
        estimated_end_date: project.estimatedEndDate || "",
        estimated_budget: project.estimatedBudget || undefined,
        status: (project.status || 'on_hold') as 'active' | 'completed' | 'on_hold' | 'cancelled',
      });
    }
  }, [project, reset]);

  if (!project) return null;

  const onSubmit = async (formData: ProjectFormData) => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        data: {
          ...formData,
          estimated_budget: formData.estimated_budget ? Number(formData.estimated_budget) : undefined,
          employee_manager_id: formData.employee_manager_id || undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{project.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {formatStatusText(project.status)}
                </Badge>
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormInput
              id="projectName"
              label="Project Name"
              placeholder="Enter project name"
              required
              error={errors.name?.message}
              disabled={isSubmitting}
              {...register("name")}
            />

            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.client_id && (
                <p className="text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_manager_id">Project Manager</Label>
              <Controller
                name="employee_manager_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        employees.length === 0
                          ? "No employees available"
                          : "Select a project manager (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employee_manager_id && (
                <p className="text-sm text-red-600">{errors.employee_manager_id.message}</p>
              )}
              {employees.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No employees found. Add an employee in the Employees section.
                </p>
              )}
            </div>

            <FormInput
              id="projectAddress"
              label="Project Address"
              placeholder="Enter project address"
              required
              error={errors.address?.message}
              disabled={isSubmitting}
              {...register("address")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDateInput
                id="startDate"
                label="Start Date"
                error={errors.start_date?.message}
                disabled={isSubmitting}
                {...register("start_date")}
              />

              <FormDateInput
                id="estimatedEndDate"
                label="Estimated End Date"
                error={errors.estimated_end_date?.message}
                disabled={isSubmitting}
                {...register("estimated_end_date")}
              />
            </div>

            <FormInput
              id="estimatedBudget"
              label="Estimated Budget"
              type="number"
              step="0.01"
              placeholder="Enter budget"
              error={errors.estimated_budget?.message}
              disabled={isSubmitting}
              {...register("estimated_budget", { valueAsNumber: true })}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormSelect
                  label="Status"
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.status?.message}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'on_hold', label: 'On Hold' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              )}
            />

            <FormTextarea
              id="projectDescription"
              label="Project Description"
              placeholder="Enter project description"
              rows={4}
              error={errors.description?.message}
              disabled={isSubmitting}
              {...register("description")}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
              <p className="text-base text-card-foreground">{project.address}</p>
            </div>
          </div>

          {/* Client Information */}
          {project.client && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                <p className="text-base font-medium text-card-foreground">
                  {project.client.company_name}
                </p>
                {project.client.company_email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.client.company_email}
                  </p>
                )}
                {project.client.company_phone && (
                  <p className="text-sm text-muted-foreground">
                    {project.client.company_phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Employee Manager */}
          {project.employee_manager && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Project Manager
                </p>
                <p className="text-base font-medium text-card-foreground">
                  {project.employee_manager.name}
                </p>
                {project.employee_manager.email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.employee_manager.email}
                  </p>
                )}
                {project.employee_manager.phone && (
                  <p className="text-sm text-muted-foreground">
                    {project.employee_manager.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {(project.startDate || project.estimatedEndDate) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.startDate && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Start Date
                    </p>
                    <p className="text-base text-card-foreground">
                      {formatDate(project.startDate)}
                    </p>
                  </div>
                </div>
              )}

              {project.estimatedEndDate && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Est. End Date
                    </p>
                    <p className="text-base text-card-foreground">
                      {formatDate(project.estimatedEndDate)}
                    </p>
                    {project.status === "active" && (
                      <p
                        className={`text-sm mt-1 ${
                          getDateStatus(project.estimatedEndDate).color
                        }`}
                      >
                        {getDateStatus(project.estimatedEndDate).message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Description */}
          {project.description && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-base text-card-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  window.location.href = `/blueprints/${project.id}`;
                }}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                View Blueprints
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

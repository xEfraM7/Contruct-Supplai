"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectSchema, type ProjectFormData } from "@/lib/validations/project";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { useClients } from "@/lib/hooks/use-clients";
import { useEmployees } from "@/lib/hooks/use-employees";
import { CreateProjectModalProps } from "./types/modal-types";

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const createProject = useCreateProject();
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
    defaultValues: {
      client_id: "",
      employee_manager_id: "",
    },
  });

  // All employees can be project managers
  const projectManagers = employees;

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const result = await createProject.mutateAsync({
        ...data,
        status: 'on_hold', // Always create with on_hold status
        estimated_budget: data.estimated_budget ? Number(data.estimated_budget) : undefined,
        employee_manager_id: data.employee_manager_id || undefined,
      });

      reset();
      onOpenChange(false);

      if (onProjectCreated) {
        onProjectCreated();
      }

      // Redirect to blueprints with the new project ID
      if (result.project?.id) {
        router.push(`/blueprints/${result.project.id}`);
      }
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Error creating project:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
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
                        projectManagers.length === 0
                          ? "No project managers available"
                          : "Select a project manager (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {projectManagers.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employee_manager_id && (
                <p className="text-sm text-red-600">{errors.employee_manager_id.message}</p>
              )}
              {projectManagers.length === 0 && (
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

            <FormTextarea
              id="projectDescription"
              label="Project Description"
              placeholder="Enter project description"
              rows={4}
              error={errors.description?.message}
              disabled={isSubmitting}
              {...register("description")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

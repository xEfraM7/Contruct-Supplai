"use client";

import { useForm } from "react-hook-form";
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
import { FormInput, FormTextarea, FormDateInput } from "@/components/form";
import { projectSchema, type ProjectFormData } from "@/lib/validations/project";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { CreateProjectModalProps } from "./types/modal-types";

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "onBlur", // Validate on blur (when user leaves field)
    reValidateMode: "onChange", // Re-validate on change after first validation
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const result = await createProject.mutateAsync(data);

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="projectName"
                label="Project Name"
                placeholder="Enter project name"
                required
                error={errors.name?.message}
                disabled={isSubmitting}
                {...register("name")}
              />

              <FormInput
                id="clientName"
                label="Client Name"
                placeholder="Enter client name"
                required
                error={errors.client_name?.message}
                disabled={isSubmitting}
                {...register("client_name")}
              />
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
              <FormInput
                id="clientPhone"
                label="Client Phone"
                type="tel"
                placeholder="Enter client phone"
                error={errors.client_phone?.message}
                disabled={isSubmitting}
                {...register("client_phone")}
              />

              <FormInput
                id="clientEmail"
                label="Client Email"
                type="email"
                placeholder="Enter client email"
                error={errors.client_email?.message}
                disabled={isSubmitting}
                {...register("client_email")}
              />
            </div>

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
              placeholder="Enter budget"
              error={errors.estimated_budget?.message}
              disabled={isSubmitting}
              {...register("estimated_budget")}
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

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
import { useProjectManagers } from "@/lib/hooks/use-project-managers";
import { CreateProjectModalProps } from "./types/modal-types";

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const { data: clients = [] } = useClients();
  const { data: allContacts = [] } = useProjectManagers();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Watch the selected client
  const selectedClientId = watch('client_id');

  // Filter project managers based on selected client and role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableProjectManagers = allContacts.filter((contact: any) => {
    return contact.client_id === selectedClientId && contact.role === 'project_manager';
  });

  // Reset project manager when client changes
  const handleClientChange = (clientId: string) => {
    setValue('client_id', clientId);
    setValue('project_manager_id', undefined);
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const result = await createProject.mutateAsync({
        ...data,
        status: 'on_hold', // Always create with on_hold status
        estimated_budget: data.estimated_budget ? Number(data.estimated_budget) : undefined,
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
                    onValueChange={handleClientChange}
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
              <Label htmlFor="project_manager_id">Project Manager</Label>
              <Controller
                name="project_manager_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || !selectedClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedClientId 
                          ? "Select a client first" 
                          : availableProjectManagers.length === 0
                          ? "No project managers available"
                          : "Select a project manager (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {availableProjectManagers.map((pm: any) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          {pm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.project_manager_id && (
                <p className="text-sm text-red-600">{errors.project_manager_id.message}</p>
              )}
              {selectedClientId && availableProjectManagers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No project managers found for this client. Add a contact with &quot;Project Manager&quot; role first.
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

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/form";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { useCreateClient } from "@/lib/hooks/use-clients";
import { Loader2 } from "lucide-react";
import { CreateClientModalProps } from "./types/client-types";

export function CreateClientModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientModalProps) {
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      await createClient.mutateAsync(data);
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <FormInput
              id="company_name"
              label="Company Name"
              placeholder="e.g., ABC Construction Inc."
              required
              error={errors.company_name?.message}
              disabled={isSubmitting}
              {...register("company_name")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="company_email"
                label="Company Email"
                type="email"
                placeholder="contact@company.com"
                error={errors.company_email?.message}
                disabled={isSubmitting}
                {...register("company_email")}
              />

              <FormInput
                id="company_phone"
                label="Company Phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                error={errors.company_phone?.message}
                disabled={isSubmitting}
                {...register("company_phone")}
              />
            </div>

            <FormInput
              id="address"
              label="Address"
              placeholder="123 Main St, City, State, ZIP"
              error={errors.address?.message}
              disabled={isSubmitting}
              {...register("address")}
            />

            <FormInput
              id="website"
              label="Website"
              type="url"
              placeholder="https://www.company.com"
              error={errors.website?.message}
              disabled={isSubmitting}
              {...register("website")}
            />

            <FormTextarea
              id="notes"
              label="Notes"
              placeholder="Additional notes about this client..."
              rows={4}
              error={errors.notes?.message}
              disabled={isSubmitting}
              {...register("notes")}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

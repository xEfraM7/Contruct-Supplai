"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FormInput, FormTextarea } from "@/components/form";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { useCreateClient } from "@/lib/hooks/use-clients";

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: "onBlur", // Validate on blur (when user leaves field)
    reValidateMode: "onChange", // Re-validate on change after first validation
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      const result = await createClient.mutateAsync(data);
      if (result.client?.id) {
        router.push(`/clients/${result.client.id}`);
      } else {
        router.push("/clients");
      }
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Error creating client:", error);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/clients")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Add New Client
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new client company
        </p>
      </div>

      <Card className="bg-card border-border max-w-2xl">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/clients")}
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
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

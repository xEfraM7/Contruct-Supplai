import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Contact } from "@/types/contact";

// Fetch contacts for a client
export function useContacts(clientId: string) {
  return useQuery({
    queryKey: ["contacts", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/contacts`);
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }
      const data = await response.json();
      return data.contacts as Contact[];
    },
    enabled: !!clientId,
  });
}

// Create contact
export function useCreateContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: Record<string, unknown>) => {
      const response = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      toast.success("Contact created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete contact
export function useDeleteContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(
        `/api/clients/${clientId}/contacts?contactId=${contactId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", clientId] });
      toast.success("Contact deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

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

// Update contact
export function useUpdateContact(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: Partial<Contact> }) => {
      const response = await fetch(`/api/clients/${clientId}/contacts?contactId=${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contact');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', clientId] });
      toast.success('Contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Fetch tasks for a contact
export function useContactTasks(contactId: string) {
  return useQuery({
    queryKey: ['contact-tasks', contactId],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contactId}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: !!contactId,
  });
}

// Create task for contact
export function useCreateContactTask(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Record<string, unknown>) => {
      const response = await fetch(`/api/contacts/${contactId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tasks', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-workload'] });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update task
export function useUpdateContactTask(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/contacts/${contactId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tasks', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-workload'] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete task
export function useDeleteContactTask(contactId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/contacts/${contactId}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tasks', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-workload'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Fetch workload summary
export function useContactWorkload(clientId: string) {
  return useQuery({
    queryKey: ['contact-workload', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/workload`);
      if (!response.ok) throw new Error('Failed to fetch workload');
      return response.json();
    },
    enabled: !!clientId,
  });
}

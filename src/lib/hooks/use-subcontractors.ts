import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Subcontractor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  activeProjects: number;
  created_at: string;
}

// Fetch subcontractors
export function useSubcontractors() {
  return useQuery({
    queryKey: ["subcontractors"],
    queryFn: async () => {
      const response = await fetch("/api/subcontractors");
      if (!response.ok) {
        throw new Error("Failed to fetch subcontractors");
      }
      const data = await response.json();
      return data.subcontractors as Subcontractor[];
    },
  });
}

// Create subcontractor
export function useCreateSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcontractorData: Record<string, unknown>) => {
      const response = await fetch("/api/subcontractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subcontractorData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create subcontractor");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      toast.success("Subcontractor created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete subcontractor
export function useDeleteSubcontractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subcontractors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete subcontractor");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractors"] });
      toast.success("Subcontractor deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

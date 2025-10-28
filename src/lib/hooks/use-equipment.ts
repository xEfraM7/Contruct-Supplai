import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Equipment } from "@/types/equipment";

// Fetch equipment
export function useEquipment() {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const response = await fetch("/api/equipment");
      if (!response.ok) {
        throw new Error("Failed to fetch equipment");
      }
      const data = await response.json();
      return data.equipment as Equipment[];
    },
  });
}

interface CreateEquipmentData {
  name: string;
  tag: string;
  category: string;
  status?: string;
  location?: string;
  value: number;
  quantity: number;
  purchase_date?: string;
  next_maintenance?: string;
  notes?: string;
}

// Create equipment
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipmentData: CreateEquipmentData) => {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete equipment
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete equipment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

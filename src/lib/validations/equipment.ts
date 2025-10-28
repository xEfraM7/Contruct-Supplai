import { z } from "zod";

export const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tag: z.string().min(1, "Tag is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["available", "checked_out", "maintenance"]).optional(),
  location: z.string().optional(),
  value: z.string().min(1, "Value is required"),
  quantity: z.string().min(1, "Quantity is required"),
  purchase_date: z.string().optional(),
  next_maintenance: z.string().optional(),
  notes: z.string().optional(),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

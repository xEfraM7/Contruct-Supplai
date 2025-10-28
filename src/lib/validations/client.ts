import { z } from "zod";

export const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_email: z.string().email("Invalid email").optional().or(z.literal("")),
  company_phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

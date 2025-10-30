import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  position: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

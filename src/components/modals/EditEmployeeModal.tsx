"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form";
import { useUpdateEmployee } from "@/lib/hooks/use-employees";
import type { Employee } from "@/types/employee";
import { useEffect } from "react";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onEmployeeUpdated?: () => void;
}

export function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
  onEmployeeUpdated,
}: EditEmployeeModalProps) {
  const updateEmployee = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    mode: "onBlur",
    defaultValues: {
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone,
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    reset({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone,
    });
  }, [employee, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        data: {
          ...data,
          email: data.email || undefined,
        },
      });

      onOpenChange(false);

      if (onEmployeeUpdated) {
        onEmployeeUpdated();
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <FormInput
              id="name"
              label="Full Name"
              placeholder="John Doe"
              required
              error={errors.name?.message}
              disabled={isSubmitting}
              {...register("name")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="email"
                label="Email"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register("email")}
              />

              <FormInput
                id="phone"
                label="Phone"
                placeholder="+1234567890"
                required
                error={errors.phone?.message}
                disabled={isSubmitting}
                {...register("phone")}
              />
            </div>
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

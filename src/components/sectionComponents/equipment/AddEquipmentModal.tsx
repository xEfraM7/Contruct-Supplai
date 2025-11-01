"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  FormInput,
  FormTextarea,
  FormDateInput,
  FormSelect,
} from "@/components/form";
import {
  equipmentSchema,
  type EquipmentFormData,
} from "@/lib/validations/equipment";
import { useCreateEquipment } from "@/lib/hooks/use-equipment";
import { AddEquipmentModalProps } from "./types/equipment-types";



const categories = [
  { value: "Aerial", label: "Aerial" },
  { value: "Survey", label: "Survey" },
  { value: "Heavy Machinery", label: "Heavy Machinery" },
  { value: "Power Tools", label: "Power Tools" },
  { value: "Hand Tools", label: "Hand Tools" },
  { value: "Safety Equipment", label: "Safety Equipment" },
  { value: "Vehicles", label: "Vehicles" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "checked_out", label: "Checked Out" },
  { value: "maintenance", label: "Maintenance" },
];

export function AddEquipmentModal({
  open,
  onOpenChange,
  onEquipmentCreated,
}: AddEquipmentModalProps) {
  const createEquipment = useCreateEquipment();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    mode: "onBlur", // Validate on blur (when user leaves field)
    reValidateMode: "onChange", // Re-validate on change after first validation
    defaultValues: {
      status: "available",
      quantity: "1",
    },
  });

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      await createEquipment.mutateAsync({
        name: data.name,
        tag: data.tag,
        category: data.category,
        status: data.status,
        location: data.location || undefined,
        value: parseFloat(data.value),
        quantity: parseInt(data.quantity) || 1,
        purchase_date: data.purchase_date || undefined,
        next_maintenance: data.next_maintenance || undefined,
        notes: data.notes || undefined,
      });

      onEquipmentCreated();
      onOpenChange(false);
      reset();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Error creating equipment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <FormInput
              id="name"
              label="Equipment Name"
              placeholder="e.g., Scissor Lift 19ft"
              required
              error={errors.name?.message}
              disabled={isSubmitting}
              {...register("name")}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="tag"
                label="Asset Tag"
                placeholder="e.g., EQ-001"
                required
                error={errors.tag?.message}
                disabled={isSubmitting}
                {...register("tag")}
              />

              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    id="category"
                    label="Category"
                    placeholder="Select category"
                    required
                    options={categories}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.category?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    id="status"
                    label="Status"
                    options={statusOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.status?.message}
                    disabled={isSubmitting}
                  />
                )}
              />

              <FormInput
                id="location"
                label="Location"
                placeholder="e.g., Downtown Office"
                error={errors.location?.message}
                disabled={isSubmitting}
                {...register("location")}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormInput
                id="value"
                label="Value ($)"
                type="number"
                step="0.01"
                placeholder="e.g., 15000"
                required
                error={errors.value?.message}
                disabled={isSubmitting}
                {...register("value")}
              />

              <FormInput
                id="quantity"
                label="Quantity"
                type="number"
                min="1"
                placeholder="1"
                required
                error={errors.quantity?.message}
                disabled={isSubmitting}
                {...register("quantity")}
              />

              <FormDateInput
                id="purchase_date"
                label="Purchase Date"
                error={errors.purchase_date?.message}
                disabled={isSubmitting}
                {...register("purchase_date")}
              />
            </div>

            <FormDateInput
              id="next_maintenance"
              label="Next Maintenance"
              error={errors.next_maintenance?.message}
              disabled={isSubmitting}
              {...register("next_maintenance")}
            />

            <FormTextarea
              id="notes"
              label="Notes"
              placeholder="Additional notes..."
              rows={3}
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
                "Create Equipment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

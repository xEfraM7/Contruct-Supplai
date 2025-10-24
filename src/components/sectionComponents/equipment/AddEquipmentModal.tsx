"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEquipment } from "@/lib/actions/equipment-actions";
import { Loader2 } from "lucide-react";

interface AddEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentCreated: () => void;
}

const categories = [
  "Aerial",
  "Survey",
  "Heavy Machinery",
  "Power Tools",
  "Hand Tools",
  "Safety Equipment",
  "Vehicles",
  "Other",
];

export function AddEquipmentModal({
  open,
  onOpenChange,
  onEquipmentCreated,
}: AddEquipmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    category: "",
    status: "available" as "available" | "checked_out" | "maintenance",
    location: "",
    value: "",
    quantity: "1",
    purchase_date: "",
    next_maintenance: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createEquipment({
        name: formData.name,
        tag: formData.tag,
        category: formData.category,
        status: formData.status,
        location: formData.location || undefined,
        value: parseFloat(formData.value),
        quantity: parseInt(formData.quantity) || 1,
        purchase_date: formData.purchase_date || undefined,
        next_maintenance: formData.next_maintenance || undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        onEquipmentCreated();
        onOpenChange(false);
        // Reset form
        setFormData({
          name: "",
          tag: "",
          category: "",
          status: "available",
          location: "",
          value: "",
          quantity: "1",
          purchase_date: "",
          next_maintenance: "",
          notes: "",
        });
      } else {
        alert(result.error || "Failed to create equipment");
      }
    } catch (error) {
      console.error("Error creating equipment:", error);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Equipment Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Scissor Lift 19ft"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Tag and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tag">
                  Asset Tag <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tag"
                  placeholder="e.g., EQ-001"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, status: value as "available" | "checked_out" | "maintenance" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown Office"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Value, Quantity and Purchase Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value">
                  Value ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 15000"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <DateInput
                  id="purchase_date"
                  value={formData.purchase_date}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Next Maintenance */}
            <div className="grid gap-2">
              <Label htmlFor="next_maintenance">Next Maintenance Date</Label>
              <DateInput
                id="next_maintenance"
                value={formData.next_maintenance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    next_maintenance: e.target.value,
                  })
                }
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Equipment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

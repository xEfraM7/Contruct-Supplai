"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoreVertical, AlertTriangle, Loader2 } from "lucide-react";
import type { Equipment } from "@/lib/actions/equipment-actions";
import { deleteEquipment } from "@/lib/actions/equipment-actions";

interface EquipmentTableProps {
  equipment: Equipment[];
  onRefresh: () => void;
}

export function EquipmentTable({ equipment, onRefresh }: EquipmentTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique categories
  const categories = Array.from(
    new Set(equipment.map((e) => e.category))
  ).sort();

  // Filter equipment by category
  const filteredEquipment =
    selectedCategory === "all"
      ? equipment
      : equipment.filter((e) => e.category === selectedCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Available
          </Badge>
        );
      case "checked_out":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            Checked Out
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="destructive">
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDeleteClick = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipmentToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteEquipment(equipmentToDelete.id);
      if (result.success) {
        setDeleteModalOpen(false);
        setEquipmentToDelete(null);
        onRefresh();
      } else {
        alert(result.error || "Failed to delete equipment");
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
      alert("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-card-foreground">
              Equipment Inventory
            </CardTitle>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No equipment found. Add your first equipment to get started.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      ASSET
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      TAG
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      CATEGORY
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      STATUS
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      LOCATION
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      NEXT MAINTENANCE
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      QTY
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      VALUE
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-card-foreground whitespace-nowrap">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2 sm:px-4">
                        <p className="font-medium text-card-foreground text-xs sm:text-sm">
                          {item.name}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.tag}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm text-card-foreground">
                          {item.category}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm text-card-foreground">
                          {item.location || "—"}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm text-card-foreground">
                          {formatDate(item.next_maintenance)}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm text-card-foreground">
                          {item.quantity}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <p className="text-xs sm:text-sm font-medium text-card-foreground">
                          {formatCurrency(Number(item.value))}
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Check Out</DropdownMenuItem>
                            <DropdownMenuItem>
                              Schedule Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(item)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Delete Equipment</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this equipment? All associated
              data will be permanently removed.
            </p>
            {equipmentToDelete && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="font-semibold text-card-foreground">
                  {equipmentToDelete.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {equipmentToDelete.tag}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Equipment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

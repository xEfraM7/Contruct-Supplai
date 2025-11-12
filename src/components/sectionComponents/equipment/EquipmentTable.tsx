"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { themeColors } from "@/lib/theme";
import { EquipmentTableProps } from "./types/equipment-types";



export function EquipmentTable({ equipment }: EquipmentTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
          <Badge className={themeColors.equipmentStatus.available.badge}>
            {themeColors.equipmentStatus.available.label}
          </Badge>
        );
      case "checked_out":
        return (
          <Badge className={themeColors.equipmentStatus.checked_out.badge}>
            {themeColors.equipmentStatus.checked_out.label}
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



  return (
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
            <div className="overflow-x-auto custom-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
  );
}

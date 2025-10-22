"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle, Truck, Wrench } from "lucide-react";
import type { Equipment } from "@/lib/actions/equipment-actions";

interface EquipmentStatsProps {
  equipment: Equipment[];
}

export function EquipmentStats({ equipment }: EquipmentStatsProps) {
  const totalAssets = equipment.length;
  const totalItems = equipment.reduce((sum, e) => sum + (e.quantity || 1), 0);
  const available = equipment.filter((e) => e.status === "available").length;
  const checkedOut = equipment.filter((e) => e.status === "checked_out").length;
  
  // Due maintenance: equipos con next_maintenance <= hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueMaintenance = equipment.filter((e) => {
    if (!e.next_maintenance) return false;
    const maintenanceDate = new Date(e.next_maintenance);
    maintenanceDate.setHours(0, 0, 0, 0);
    return maintenanceDate <= today;
  }).length;

  const stats = [
    {
      label: "Total Items",
      value: totalItems.toString(),
      icon: Package,
      change: `${totalAssets} asset types`,
    },
    {
      label: "Available",
      value: available.toString(),
      icon: CheckCircle,
      change: "",
    },
    {
      label: "Checked Out",
      value: checkedOut.toString(),
      icon: Truck,
      change: "",
    },
    {
      label: "Due Maintenance",
      value: dueMaintenance.toString(),
      icon: Wrench,
      change: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className="text-xs mt-2">{stat.change}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

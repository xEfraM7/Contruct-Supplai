"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { EquipmentStats } from "@/components/sectionComponents/equipment/EquipmentStats";
import { EquipmentTable } from "@/components/sectionComponents/equipment/EquipmentTable";
import { AddEquipmentModal } from "@/components/sectionComponents/equipment/AddEquipmentModal";
import type { Equipment } from "@/lib/actions/equipment-actions";

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching equipment via API...");
      const response = await fetch("/api/equipment");
      const result = await response.json();
      console.log("Equipment API result:", result);
      
      if (result.success && result.equipment) {
        console.log("Equipment data:", result.equipment);
        setEquipment(result.equipment);
      } else {
        console.error("Failed to fetch equipment:", result.error);
        alert(`Error: ${result.error || "Failed to load equipment"}`);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      alert("Error loading equipment. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleEquipmentCreated = () => {
    fetchEquipment();
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Equipment & Tools
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track assets and maintenance schedules
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <AddEquipmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onEquipmentCreated={handleEquipmentCreated}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <EquipmentStats equipment={equipment} />
          <EquipmentTable equipment={equipment} onRefresh={fetchEquipment} />
        </>
      )}
    </section>
  );
}

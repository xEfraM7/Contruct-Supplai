"use client";

import { useState } from "react";
import { useEquipment } from "@/lib/hooks/use-equipment";

export function useEquipmentLogic() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: equipment = [], isLoading } = useEquipment();

  const handleEquipmentCreated = () => {
    setIsModalOpen(false);
  };

  return {
    equipment,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    handleEquipmentCreated,
  };
}

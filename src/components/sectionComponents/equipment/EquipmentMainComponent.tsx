"use client";

import { useEquipmentLogic } from "@/hooks/useEquipmentLogic";
import { EquipmentView } from "./EquipmentView";

export default function EquipmentMainComponent() {
  const {
    equipment,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    handleEquipmentCreated,
  } = useEquipmentLogic();

  return (
    <EquipmentView
      equipment={equipment}
      isLoading={isLoading}
      isModalOpen={isModalOpen}
      onOpenModal={setIsModalOpen}
      onEquipmentCreated={handleEquipmentCreated}
    />
  );
}

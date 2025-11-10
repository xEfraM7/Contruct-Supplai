import { Equipment } from "@/types/equipment";

export interface AddEquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentCreated: () => void;
}

export interface EquipmentStatsProps {
  equipment: Equipment[];
}

export interface EquipmentTableProps {
  equipment: Equipment[];
}

export interface EquipmentViewProps {
  equipment: Equipment[];
  isLoading: boolean;
  isModalOpen: boolean;
  onOpenModal: (open: boolean) => void;
  onEquipmentCreated: () => void;
}
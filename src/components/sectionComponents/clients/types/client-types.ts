import type { Client } from "@/types/client";

export interface ClientsViewProps {
  clients: Client[];
  isLoading: boolean;
  isCreateModalOpen: boolean;
  onClientClick: (clientId: string) => void;
  onAddClient: () => void;
  onOpenCreateModal: (open: boolean) => void;
  onCreateSuccess: () => void;
}

export interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

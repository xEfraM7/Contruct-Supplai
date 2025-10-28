"use client";

import { useClientsLogic } from "@/hooks/useClientsLogic";
import { ClientsView } from "./ClientsView";

export default function ClientsMainComponent() {
  const {
    clients,
    isLoading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleClientClick,
    handleAddClient,
    handleCreateSuccess,
  } = useClientsLogic();

  return (
    <ClientsView
      clients={clients}
      isLoading={isLoading}
      isCreateModalOpen={isCreateModalOpen}
      onClientClick={handleClientClick}
      onAddClient={handleAddClient}
      onOpenCreateModal={setIsCreateModalOpen}
      onCreateSuccess={handleCreateSuccess}
    />
  );
}

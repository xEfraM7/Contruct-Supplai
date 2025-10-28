"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/lib/hooks/use-clients";

export function useClientsLogic() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: clients = [], isLoading } = useClients();

  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleAddClient = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  return {
    clients,
    isLoading,
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleClientClick,
    handleAddClient,
    handleCreateSuccess,
  };
}

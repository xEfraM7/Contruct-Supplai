"use client";

import { useState } from "react";
import { useAgents, useDeleteAgent, useToggleAgentActive } from "@/lib/hooks/use-agents";
import { useConfirm } from "@/hooks/use-confirm";

export function useAgentsLogic() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: agents = [], isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();
  const toggleActive = useToggleAgentActive();

  const handleDeleteAgent = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Agent",
      description: "Are you sure you want to delete this agent? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      deleteAgent.mutate(id);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActive.mutate({ id, isActive });
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
  };

  return {
    agents,
    isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    handleDeleteAgent,
    handleToggleActive,
    handleCreateSuccess,
    ConfirmDialog,
  };
}

"use client";

import { useAgentsLogic } from "@/hooks/useAgentsLogic";
import { AgentsView } from "./AgentsView";

export default function AgentsMainComponent() {
  const {
    agents,
    isLoading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    handleDeleteAgent,
    handleToggleActive,
    handleCreateSuccess,
    ConfirmDialog,
  } = useAgentsLogic();

  return (
    <>
      <AgentsView
        agents={agents}
        isLoading={isLoading}
        isCreateDialogOpen={isCreateDialogOpen}
        onOpenCreateDialog={setIsCreateDialogOpen}
        onDeleteAgent={handleDeleteAgent}
        onToggleActive={handleToggleActive}
        onCreateSuccess={handleCreateSuccess}
      />
      <ConfirmDialog />
    </>
  );
}

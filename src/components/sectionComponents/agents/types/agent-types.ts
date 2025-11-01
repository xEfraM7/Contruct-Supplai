import type { Agent } from "@/types/agent";

export interface AgentCardProps {
  agent: {
    id: string;
    agent_id: string;
    agent_name: string;
    voice_id: string;
    language: string;
    is_active: boolean;
    created_at: string;
  };
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export interface AgentsViewProps {
  agents: Agent[];
  isLoading: boolean;
  isCreateDialogOpen: boolean;
  onOpenCreateDialog: (open: boolean) => void;
  onDeleteAgent: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onCreateSuccess: () => void;
}

export interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

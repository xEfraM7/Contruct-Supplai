import type { Project, ProjectWithDetails } from "@/types/project";

export interface ProjectsViewProps {
  projects: ProjectWithDetails[];
  isLoading: boolean;
  metrics?: {
    activeContracts: number;
    totalBudget: number;
    onTimeDelivery: number;
  };
  metricsLoading: boolean;
  isModalOpen: boolean;
  expandedProjects: Set<string>;
  onOpenModal: (open: boolean) => void;
  onToggleProject: (projectId: string, e?: React.MouseEvent) => void;
  onDeleteClick: (project: ProjectWithDetails, e: React.MouseEvent) => void;
  calculateProgress: (project: ProjectWithDetails) => number;
  getStatusColor: (status?: string) => string;
}

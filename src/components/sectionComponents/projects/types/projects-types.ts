import type { Project } from "@/types/project";

export interface ProjectsViewProps {
  projects: Project[];
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
  onDeleteClick: (project: Project, e: React.MouseEvent) => void;
  calculateProgress: (project: Project) => number;
  getStatusColor: (status?: string) => string;
}

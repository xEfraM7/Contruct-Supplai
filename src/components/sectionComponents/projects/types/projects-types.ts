import type { ProjectWithDetails } from "@/types/project";

export interface ProjectsViewProps {
  projects: ProjectWithDetails[];
  isLoading: boolean;
  expandedProjects: Set<string>;
  onToggleProject: (projectId: string, e?: React.MouseEvent) => void;
  onDeleteClick: (project: ProjectWithDetails, e: React.MouseEvent) => void;
  calculateProgress: (project: ProjectWithDetails) => number;
  getStatusColor: (status?: string) => string;
}

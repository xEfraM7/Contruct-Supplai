"use client";

import { useState } from "react";
import { useProjects, useDeleteProject } from "@/lib/hooks/use-projects";
import { useDashboardMetrics } from "@/lib/hooks/use-dashboard-metrics";
import { useConfirm } from "@/hooks/use-confirm";
import type { Project } from "@/types/project";

export function useProjectsLogic() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: projects = [], isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  const toggleProject = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleDeleteClick = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = await confirm({
      title: "Delete Project",
      description: "Are you sure you want to delete this project? All associated data will be permanently removed.",
      confirmText: "Delete Project",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      deleteProject.mutate(project.id);
    }
  };

  const calculateProgress = (project: Project): number => {
    if (project.completionPercentage !== undefined && project.completionPercentage > 0) {
      return project.completionPercentage;
    }

    if (!project.startDate || !project.estimatedEndDate) {
      return 0;
    }

    const startDate = new Date(project.startDate);
    const endDate = new Date(project.estimatedEndDate);
    const currentDate = new Date();

    if (currentDate < startDate) return 0;
    if (currentDate > endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();

    return Math.round((elapsed / totalDuration) * 100);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return {
    projects,
    isLoading,
    metrics,
    metricsLoading,
    isModalOpen,
    setIsModalOpen,
    expandedProjects,
    toggleProject,
    handleDeleteClick,
    calculateProgress,
    getStatusColor,
    ConfirmDialog,
  };
}

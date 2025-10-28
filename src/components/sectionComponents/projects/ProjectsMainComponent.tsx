"use client";

import { useProjectsLogic } from "@/hooks/useProjectsLogic";
import { ProjectsView } from "./ProjectsView";

export default function ProjectsMainComponent() {
  const {
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
  } = useProjectsLogic();

  return (
    <>
      <ProjectsView
        projects={projects}
        isLoading={isLoading}
        metrics={metrics}
        metricsLoading={metricsLoading}
        isModalOpen={isModalOpen}
        expandedProjects={expandedProjects}
        onOpenModal={setIsModalOpen}
        onToggleProject={toggleProject}
        onDeleteClick={handleDeleteClick}
        calculateProgress={calculateProgress}
        getStatusColor={getStatusColor}
      />
      <ConfirmDialog />
    </>
  );
}

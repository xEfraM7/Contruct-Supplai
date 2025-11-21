"use client";

import { useState } from "react";
import { useProjectsLogic } from "@/hooks/useProjectsLogic";
import { KanbanBoard } from "./KanbanBoard";
import { ProjectDetailsModal } from "./ProjectDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LayoutGrid, FileText, Clock } from "lucide-react";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import type { ProjectWithDetails } from "@/types/project";

export default function ProjectsMainComponent() {
  const {
    projects,
    isLoading,
    metrics,
    metricsLoading,
    isModalOpen,
    setIsModalOpen,
    handleDeleteClick,
    handleStatusChange,
    calculateProgress,
    getStatusColor,
    ConfirmDialog,
  } = useProjectsLogic();

  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleCardClick = (project: ProjectWithDetails) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your construction projects • {projects.length} total
          </p>
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap items-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onProjectCreated={() => setIsModalOpen(false)}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Projects
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {metricsLoading ? "..." : metrics?.activeProjects ?? 0}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Currently active projects
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Equipment
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {metricsLoading
                    ? "..."
                    : `${(metrics?.totalEquipment ?? 0).toLocaleString()}`}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Registered equipment items
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Pending Tasks
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {metricsLoading ? "..." : `${metrics?.pendingTasks ?? 0}`}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Tasks pending or in progress
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                  <div className="h-3 bg-muted rounded w-4/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <KanbanBoard
          projects={projects}
          onDeleteClick={handleDeleteClick}
          onCardClick={handleCardClick}
          calculateProgress={calculateProgress}
          getStatusColor={getStatusColor}
          onStatusChange={handleStatusChange}
        />
      )}

      <ProjectDetailsModal
        project={selectedProject}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        calculateProgress={calculateProgress}
        getStatusColor={getStatusColor}
      />

      <ConfirmDialog />
    </section>
  );
}

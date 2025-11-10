"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { ProjectWithDetails } from "@/types/project";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  projects: ProjectWithDetails[];
  onDeleteClick: (project: ProjectWithDetails, e: React.MouseEvent) => void;
  onCardClick?: (project: ProjectWithDetails) => void;
  calculateProgress: (project: ProjectWithDetails) => number;
  getStatusColor: (status?: string) => string;
  onStatusChange: (projectId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: "active", title: "Active", color: "bg-green-500" },
  { id: "on_hold", title: "On Hold", color: "bg-yellow-500" },
  { id: "completed", title: "Completed", color: "bg-purple-500" },
  { id: "cancelled", title: "Cancelled", color: "bg-red-500" },
];

export function KanbanBoard({
  projects,
  onDeleteClick,
  onCardClick,
  calculateProgress,
  getStatusColor,
  onStatusChange,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active project
    const activeProject = projects.find((p) => p.id === activeId);
    if (!activeProject) {
      setActiveId(null);
      return;
    }

    // Check if dropped on a column
    let targetColumnId = COLUMNS.find((col) => col.id === overId)?.id;

    // If not dropped on a column, check if dropped on another card
    if (!targetColumnId) {
      const overProject = projects.find((p) => p.id === overId);
      if (overProject) {
        targetColumnId = overProject.status || "active";
      }
    }

    // Update status if changed
    if (targetColumnId && activeProject.status !== targetColumnId) {
      onStatusChange(activeId, targetColumnId);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getProjectsByStatus = (status: string) => {
    return projects.filter((p) => (p.status || "active") === status);
  };

  const activeProject = projects.find((p) => p.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => {
          const columnProjects = getProjectsByStatus(column.id);
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              count={columnProjects.length}
            >
              <div className="space-y-2">
                {columnProjects.map((project) => (
                  <KanbanCard
                    key={project.id}
                    project={project}
                    onDeleteClick={onDeleteClick}
                    onCardClick={onCardClick}
                    calculateProgress={calculateProgress}
                    getStatusColor={getStatusColor}
                  />
                ))}
                {columnProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className={`w-12 h-12 rounded-full ${column.color} opacity-20 mb-3`} />
                    <p className="text-xs text-muted-foreground font-medium">No projects</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Drag here to add</p>
                  </div>
                )}
              </div>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId && activeProject ? (
          <div className="rotate-2 scale-105 opacity-90 cursor-grabbing">
            <KanbanCard
              project={activeProject}
              onDeleteClick={onDeleteClick}
              onCardClick={onCardClick}
              calculateProgress={calculateProgress}
              getStatusColor={getStatusColor}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

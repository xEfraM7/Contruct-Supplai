"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  User,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectWithDetails } from "@/types/project";
import { formatDate } from "@/lib/utils/dateUtils";
import { themeColors } from "@/lib/theme";

interface KanbanCardProps {
  project: ProjectWithDetails;
  onDeleteClick: (project: ProjectWithDetails, e: React.MouseEvent) => void;
  onCardClick?: (project: ProjectWithDetails) => void;
  calculateProgress: (project: ProjectWithDetails) => number;
  getStatusColor: (status?: string) => string;
  isDragging?: boolean;
}

export function KanbanCard({
  project,
  onDeleteClick,
  onCardClick,
  calculateProgress,
  isDragging = false,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: project.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on drag handle or dropdown
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-drag-handle]') ||
      target.closest('[role="menu"]') ||
      target.closest('button')
    ) {
      return;
    }
    onCardClick?.(project);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`bg-card border-border hover:shadow-md hover:border-primary/50 transition-all duration-200 group ${
        isDragging ? "shadow-xl opacity-50 cursor-grabbing" : "hover:scale-[1.02] cursor-pointer"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div
            {...attributes}
            {...listeners}
            data-drag-handle
            className="cursor-grab active:cursor-grabbing mt-0.5 hover:bg-muted/50 rounded p-0.5 transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-card-foreground truncate mb-0.5 leading-tight">
              {project.name}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {project.address}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/blueprints/${project.id}`;
                }}
                className="cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-2" />
                View Blueprints
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => onDeleteClick(project, e)}
                className={`${themeColors.interactive.delete.text} cursor-pointer`}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.status === "active" && (
          <div className="mb-2 bg-muted/30 rounded-md p-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Progress</span>
              <span className="text-xs font-semibold text-primary">{calculateProgress(project)}%</span>
            </div>
            <Progress value={calculateProgress(project)} className="h-1.5" />
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          {project.client && (
            <div className="flex items-center gap-1.5 text-xs bg-muted/20 rounded px-2 py-1">
              <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground truncate text-[11px]">
                {project.client.company_name}
              </span>
            </div>
          )}

          {project.estimatedEndDate && (
            <div className="flex items-center gap-1.5 text-xs bg-muted/20 rounded px-2 py-1">
              <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground text-[11px]">
                {formatDate(project.estimatedEndDate)}
              </span>
            </div>
          )}

          {project.estimatedBudget && (
            <div className="flex items-center gap-1.5 text-xs bg-muted/20 rounded px-2 py-1">
              <DollarSign className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground font-medium text-[11px]">
                ${Number(project.estimatedBudget).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

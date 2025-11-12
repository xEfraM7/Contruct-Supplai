"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  ArrowRight,
  Clock,
} from "lucide-react";
import { ProjectWithDetails } from "@/types/project";
import { formatDate, getDateStatus } from "@/lib/utils/dateUtils";

interface ProjectDetailsModalProps {
  project: ProjectWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculateProgress: (project: ProjectWithDetails) => number;
  getStatusColor: (status?: string) => string;
}

// Helper function to format status text
const formatStatusText = (status?: string): string => {
  if (!status) return "Active";
  
  const statusMap: Record<string, string> = {
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
    planning: "Planning",
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

export function ProjectDetailsModal({
  project,
  open,
  onOpenChange,
  calculateProgress,
  getStatusColor,
}: ProjectDetailsModalProps) {
  if (!project) return null;

  const progress = calculateProgress(project);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{project.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {formatStatusText(project.status)}
                </Badge>
                {project.status === "active" && (
                  <span className="text-sm text-muted-foreground">
                    {progress}% Complete
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Bar */}
          {project.status === "active" && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Project Progress
                </span>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
              <p className="text-base text-card-foreground">{project.address}</p>
            </div>
          </div>

          {/* Client Information */}
          {(project.client || project.clientName) && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                <p className="text-base font-medium text-card-foreground">
                  {project.client?.company_name || project.clientName}
                </p>
                {project.client?.company_email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.client.company_email}
                  </p>
                )}
                {project.client?.company_phone && (
                  <p className="text-sm text-muted-foreground">
                    {project.client.company_phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Project Manager */}
          {project.project_manager && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Project Manager
                </p>
                <p className="text-base font-medium text-card-foreground">
                  {project.project_manager.name}
                </p>
                {project.project_manager.email && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.project_manager.email}
                  </p>
                )}
                {project.project_manager.role && (
                  <p className="text-sm text-muted-foreground">
                    {project.project_manager.role}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {(project.startDate || project.estimatedEndDate) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.startDate && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Start Date
                    </p>
                    <p className="text-base text-card-foreground">
                      {formatDate(project.startDate)}
                    </p>
                  </div>
                </div>
              )}

              {project.estimatedEndDate && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Est. End Date
                    </p>
                    <p className="text-base text-card-foreground">
                      {formatDate(project.estimatedEndDate)}
                    </p>
                    {project.status === "active" && (
                      <p
                        className={`text-sm mt-1 ${
                          getDateStatus(project.estimatedEndDate).color
                        }`}
                      >
                        {getDateStatus(project.estimatedEndDate).message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Budget */}
          {(project.estimatedBudget || project.actual_cost) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.estimatedBudget && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Estimated Budget
                    </p>
                    <p className="text-xl font-bold text-card-foreground">
                      ${Number(project.estimatedBudget).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {project.actual_cost !== undefined && project.actual_cost > 0 && (
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    project.estimatedBudget && project.actual_cost > project.estimatedBudget
                      ? "bg-red-500/10"
                      : "bg-blue-500/10"
                  }`}>
                    <DollarSign className={`w-5 h-5 ${
                      project.estimatedBudget && project.actual_cost > project.estimatedBudget
                        ? "text-red-600"
                        : "text-blue-600"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Actual Cost
                    </p>
                    <p className="text-xl font-bold text-card-foreground">
                      ${Number(project.actual_cost).toLocaleString()}
                    </p>
                    {project.estimatedBudget && (
                      <p
                        className={`text-sm mt-1 ${
                          project.actual_cost > project.estimatedBudget
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {project.actual_cost > project.estimatedBudget
                          ? `$${(project.actual_cost - project.estimatedBudget).toLocaleString()} over budget`
                          : `$${(project.estimatedBudget - project.actual_cost).toLocaleString()} remaining`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-base text-card-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => {
                window.location.href = `/blueprints/${project.id}`;
              }}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              View Blueprints
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Trash2,
  User,
  Calendar,
  DollarSign as Budget,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { themeColors } from "@/lib/theme";
import { formatDate, getDateStatus } from "@/lib/utils/dateUtils";
import { ProjectsViewProps } from "./types/projects-types";

// Helper function to format status text
const formatStatusText = (status?: string): string => {
  if (!status) return "Active";
  
  // Convert status to readable format
  const statusMap: Record<string, string> = {
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
    planning: "Planning",
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

export function ProjectsView({
  projects,
  isLoading,
  expandedProjects,
  onToggleProject,
  onDeleteClick,
  calculateProgress,
  getStatusColor,
}: ProjectsViewProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          Active Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects yet. Create your first project to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id);
              return (
                <Card
                  key={project.id}
                  className="bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/50 transition-all group"
                >
                  <CardContent>
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => onToggleProject(project.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-card-foreground">
                            {project.name}
                          </h3>
                          <Badge className={getStatusColor(project.status)}>
                            {formatStatusText(project.status)}
                          </Badge>
                        </div>

                        {project.status === "active" && (
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">
                                Progress
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {calculateProgress(project)}%
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress(project)}
                              className="h-2"
                            />
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {project.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => onDeleteClick(project, e)}
                          className={`text-muted-foreground ${themeColors.interactive.delete.hover} opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                          {/* Client Information */}
                          {(project.client || project.clientName) && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Client
                                </p>
                                <p className="font-medium text-card-foreground">
                                  {project.client?.company_name || project.clientName}
                                </p>
                                {project.client?.company_email && (
                                  <p className="text-xs text-muted-foreground">
                                    {project.client.company_email}
                                  </p>
                                )}
                                {project.client?.company_phone && (
                                  <p className="text-xs text-muted-foreground">
                                    {project.client.company_phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Project Manager Information */}
                          {project.project_manager && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Project Manager
                                </p>
                                <p className="font-medium text-card-foreground">
                                  {project.project_manager.name}
                                </p>
                                {project.project_manager.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {project.project_manager.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {project.startDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Start Date
                                </p>
                                <p className="font-medium text-card-foreground">
                                  {formatDate(project.startDate)}
                                </p>
                              </div>
                            </div>
                          )}

                          {project.estimatedEndDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Est. End Date
                                </p>
                                <p className="font-medium text-card-foreground">
                                  {formatDate(project.estimatedEndDate)}
                                </p>
                                {project.status === "active" && (
                                  <p
                                    className={`text-xs ${
                                      getDateStatus(project.estimatedEndDate)
                                        .color
                                    }`}
                                  >
                                    {
                                      getDateStatus(project.estimatedEndDate)
                                        .message
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {project.estimatedBudget && (
                            <div className="flex items-center gap-2 text-sm">
                              <Budget className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Estimated Budget
                                </p>
                                <p className="font-medium text-card-foreground">
                                  ${Number(project.estimatedBudget).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}

                          {project.actual_cost !== undefined && project.actual_cost > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Actual Cost
                                </p>
                                <p className="font-medium text-card-foreground">
                                  ${Number(project.actual_cost).toLocaleString()}
                                </p>
                                {project.estimatedBudget && (
                                  <p className={`text-xs ${
                                    project.actual_cost > project.estimatedBudget 
                                      ? 'text-red-600' 
                                      : 'text-green-600'
                                  }`}>
                                    {project.actual_cost > project.estimatedBudget 
                                      ? `${(project.actual_cost - project.estimatedBudget).toLocaleString()} over`
                                      : `${(project.estimatedBudget - project.actual_cost).toLocaleString()} remaining`
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {project.description && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              Description
                            </p>
                            <p className="text-sm text-card-foreground">
                              {project.description}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-border flex justify-end">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/blueprints/${project.id}`;
                            }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            View Blueprints
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

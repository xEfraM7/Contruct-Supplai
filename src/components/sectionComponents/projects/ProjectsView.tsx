import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  DollarSign,
  Clock,
  Plus,
  Trash2,
  User,
  Calendar,
  DollarSign as Budget,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { themeColors } from "@/lib/theme";
import { formatDate, getDateStatus } from "@/lib/utils/dateUtils";
import { ProjectsViewProps } from "./types/projects-types";

export function ProjectsView({
  projects,
  isLoading,
  metrics,
  metricsLoading,
  isModalOpen,
  expandedProjects,
  onOpenModal,
  onToggleProject,
  onDeleteClick,
  calculateProgress,
  getStatusColor,
}: ProjectsViewProps) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Dashboard Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your construction projects
          </p>
        </div>
        <Button
          onClick={() => onOpenModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-[140px] shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={onOpenModal}
        onProjectCreated={() => onOpenModal(false)}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Contracts
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {metricsLoading ? "..." : metrics?.activeContracts ?? 0}
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
                  Total Budget
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {metricsLoading
                    ? "..."
                    : `$${(metrics?.totalBudget ?? 0).toLocaleString()}`}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Combined active projects budget
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  On Time Delivery
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {metricsLoading ? "..." : `${metrics?.onTimeDelivery ?? 0}%`}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Completed projects delivered on time
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
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
                              {project.status
                                ? project.status.charAt(0).toUpperCase() +
                                  project.status.slice(1)
                                : "Active"}
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
                                        ? `$${(project.actual_cost - project.estimatedBudget).toLocaleString()} over`
                                        : `$${(project.estimatedBudget - project.actual_cost).toLocaleString()} remaining`
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
    </section>
  );
}

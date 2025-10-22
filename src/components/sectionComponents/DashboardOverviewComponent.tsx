"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  DollarSign,
  MessageSquare,
  Plus,
  Trash2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign as Budget,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";

const kpis = [
  { label: "Active Contracts", value: "24", icon: FileText, change: "+12%" },
  { label: "Total Revenue", value: "$2.4M", icon: DollarSign, change: "+8%" },
  { label: "Pending RFIs", value: "7", icon: MessageSquare, change: "-3%" },
];

interface Project {
  id: string;
  name: string;
  clientName?: string;
  address: string;
  clientPhone?: string;
  clientEmail?: string;
  startDate?: string;
  estimatedBudget?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function DashboardOverviewComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

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

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = () => {
    fetchProjects();
  };

  const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
        fetchProjects();
      } else {
        alert("Error deleting project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Dashboard Overview
        </h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <CreateProjectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onProjectCreated={handleProjectCreated}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Delete Project</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this project? All associated data
              will be permanently removed.
            </p>
            {projectToDelete && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="font-semibold text-card-foreground">
                  {projectToDelete.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {projectToDelete.address}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {kpi.value}
                  </p>
                  <p className="text-xs mt-2">{kpi.change} from last month</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
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
                      {/* Header - Always Visible */}
                      <div 
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-card-foreground">
                              {project.name}
                            </h3>
                            <Badge variant="secondary">Active</Badge>
                          </div>
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
                            onClick={(e) => handleDeleteClick(project, e)}
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Collapsible Details */}
                      {isExpanded && (
                        <>
                          {/* Project Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                            {project.clientName && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Client
                                  </p>
                                  <p className="font-medium text-card-foreground">
                                    {project.clientName}
                                  </p>
                                </div>
                              </div>
                            )}

                            {project.clientPhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Phone
                                  </p>
                                  <p className="font-medium text-card-foreground">
                                    {project.clientPhone}
                                  </p>
                                </div>
                              </div>
                            )}

                            {project.clientEmail && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Email
                                  </p>
                                  <p className="font-medium text-card-foreground truncate">
                                    {project.clientEmail}
                                  </p>
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
                                    {new Date(
                                      project.startDate
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            {project.estimatedBudget && (
                              <div className="flex items-center gap-2 text-sm">
                                <Budget className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Budget
                                  </p>
                                  <p className="font-medium text-card-foreground">
                                    $
                                    {Number(
                                      project.estimatedBudget
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Created
                                </p>
                                <p className="font-medium text-card-foreground">
                                  {new Date(
                                    project.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
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

                          {/* Action Button */}
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

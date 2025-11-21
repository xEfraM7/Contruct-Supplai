"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  UserCog,
  Mail,
  Phone,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Briefcase,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEmployee, useDeleteEmployee } from "@/lib/hooks/use-employees";
import { useConfirm } from "@/hooks/use-confirm";
import { EditEmployeeModal } from "@/components/modals/EditEmployeeModal";
import { themeColors } from "@/lib/theme";

export function EmployeeDetailComponent() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const { data: employeeData, isLoading } = useEmployee(employeeId);
  const deleteEmployee = useDeleteEmployee();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteEmployee = async () => {
    const confirmed = await confirm({
      title: "Delete Employee",
      description: "Are you sure you want to delete this employee? This action cannot be undone.",
      confirmText: "Delete Employee",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteEmployee.mutateAsync(employeeId);
        router.push("/employees");
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found</p>
        <Button onClick={() => router.push("/employees")} className="mt-4">
          Back to Employees
        </Button>
      </div>
    );
  }

  const employee = employeeData;

  return (
    <section>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/employees")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Active Projects
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {employee.active_projects || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Currently managing
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Total Projects
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {employee.total_projects || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  All time managed
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Clients Worked With
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {employee.clients?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Unique clients
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Info Card */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCog className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{employee.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Project Manager</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Employee
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteEmployee}
                  className={themeColors.interactive.delete.text}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Employee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Contact Information</p>
              <div className="space-y-2">
                {employee.email && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{employee.email}</p>
                    </div>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{employee.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {employee.clients && employee.clients.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Clients</p>
                <div className="flex flex-wrap gap-2">
                  {employee.clients.map((client, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      {employee.projects && employee.projects.length > 0 ? (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Managed Projects</CardTitle>
              <Badge variant="secondary">{employee.projects.length} projects</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employee.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/blueprints/${project.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h4>
                      <Badge
                        variant={project.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.clients && (
                      <div className="flex items-center gap-2 mt-2">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {project.clients.company_name}
                        </p>
                      </div>
                    )}
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Projects Yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              This employee hasn&apos;t been assigned to any projects yet. Assign them to a project from the Projects section.
            </p>
            <Button onClick={() => router.push("/overview")}>
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Modal */}
      {employeeData && (
        <EditEmployeeModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          employee={employeeData}
          onEmployeeUpdated={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, UserCog, Mail, Phone, Loader2 } from "lucide-react";
import { CreateEmployeeModal } from "@/components/modals/CreateEmployeeModal";
import { useEmployees } from "@/lib/hooks/use-employees";

export function EmployeesMainComponent() {
  const router = useRouter();
  const { data: employees = [], isLoading } = useEmployees();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Employees
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your internal team • {employees.length} total
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <CreateEmployeeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onEmployeeCreated={() => setIsModalOpen(false)}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No employees yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Start building your team by adding your first employee
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className="bg-card border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => router.push(`/employees/${employee.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <UserCog className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {employee.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Project Manager</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Active</p>
                      <p className="text-xl font-bold text-foreground">
                        {employee.active_projects || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-xl font-bold text-foreground">
                        {employee.total_projects || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

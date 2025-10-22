"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Phone, Plus, Mail, Building2, Briefcase, Loader2 } from "lucide-react";

interface Subcontractor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  activeProjects: number;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

interface FormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
}

export function SubContractorsComponent() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    company: "",
    phone: "",
    email: "",
    status: "active",
    projectId: "none",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const fetchSubcontractors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subcontractors");
      const result = await response.json();
      if (result.success) {
        setSubcontractors(result.subcontractors || []);
      } else {
        console.error("Failed to fetch subcontractors:", result.error);
      }
    } catch (error) {
      console.error("Error fetching subcontractors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects from API
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();

      if (result.success) {
        setProjects(result.projects || []);
      } else {
        console.error("Failed to fetch projects:", result.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  // Fetch projects when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      fetchProjects();
    }
  }, [isAddModalOpen]);

  const handleCall = (phone: string) => {
    // Funcionalidad desactivada por ahora
    console.log(`Call button clicked for: ${phone}`);
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.company.trim()) newErrors.company = "Company is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/subcontractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubcontractors((prev) => [result.subcontractor, ...prev]);
        setFormData({
          name: "",
          company: "",
          phone: "",
          email: "",
          status: "active",
          projectId: "none",
        });
        setErrors({});
        setIsAddModalOpen(false);
      } else {
        console.error("Failed to create subcontractor:", result.error);
        alert(result.error || "Failed to create subcontractor");
      }
    } catch (error) {
      console.error("Error creating subcontractor:", error);
      alert("An error occurred while creating the subcontractor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <section>
      {/* Header solo si hay subcontratistas */}
      {subcontractors.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Subcontractors
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your network of trusted contractors
            </p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subcontractor
          </Button>
        </div>
      )}

      {/* Estado: cargando */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : // Estado: sin subcontratistas
      subcontractors.length === 0 ? (
        <div className="text-center py-12">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subcontractor
          </Button>
        </div>
      ) : (
        // Estado: con subcontratistas
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subcontractors.map((contractor) => (
            <Card
              key={contractor.id}
              className="bg-card border-border hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {getInitials(contractor.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground text-sm truncate">
                        {contractor.name}
                      </h3>
                    </div>
                  </div>
                  {getStatusBadge(contractor.status)}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-card-foreground truncate">
                      {contractor.company}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-card-foreground truncate">
                      {contractor.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-card-foreground truncate">
                      {contractor.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-card-foreground">
                      {contractor.activeProjects} Active Project
                      {contractor.activeProjects !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleCall(contractor.phone)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call {contractor.name.split(" ")[0]}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Add Subcontractor */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Subcontractor</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="ABC Construction"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && (
                  <p className="text-sm text-red-600">{errors.company}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    handleInputChange("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Assignment (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="project">Assign to Project (Optional)</Label>
                <Select
                  value={formData.projectId || "none"}
                  onValueChange={(value) =>
                    handleInputChange("projectId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingProjects ? "Loading..." : "Select project"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subcontractor
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

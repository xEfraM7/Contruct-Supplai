"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, AlertTriangle, FileQuestion } from "lucide-react";
import { useState } from "react";

const menuItems = ["Jobs", "Discrepancies", "RFIs"];

const jobCategories = [
  { name: "Windows", count: 12 },
  { name: "Drywall", count: 8 },
  { name: "Roofing", count: 5 },
  { name: "Plumbing", count: 15 },
  { name: "Electrical", count: 10 },
  { name: "HVAC", count: 6 },
];

const discrepanciesData = [
  {
    id: 1,
    title: "Wall Dimension Mismatch",
    location: "Floor 2, Section A",
    description: "Blueprint shows 12ft wall, actual measurement is 11.5ft",
    severity: "High",
    date: "2024-10-14",
    status: "Open",
  },
  {
    id: 2,
    title: "Electrical Outlet Position",
    location: "Floor 1, Room 105",
    description: "Outlet placement conflicts with plumbing layout",
    severity: "Medium",
    date: "2024-10-13",
    status: "In Review",
  },
  {
    id: 3,
    title: "Window Size Discrepancy",
    location: "Floor 3, West Wing",
    description: "Specified window size doesn't match structural opening",
    severity: "High",
    date: "2024-10-12",
    status: "Open",
  },
];

const rfisData = [
  {
    id: "RFI-001",
    title: "HVAC System Specifications",
    submittedBy: "John Smith",
    date: "2024-10-15",
    status: "Pending Response",
    question:
      "Please clarify the BTU requirements for the main conference room HVAC unit.",
    category: "HVAC",
  },
  {
    id: "RFI-002",
    title: "Concrete Mix Design",
    submittedBy: "Maria Garcia",
    date: "2024-10-14",
    status: "Answered",
    question: "What is the required PSI for foundation concrete in Zone B?",
    category: "Structural",
  },
  {
    id: "RFI-003",
    title: "Fire Safety Equipment Location",
    submittedBy: "David Lee",
    date: "2024-10-13",
    status: "Pending Response",
    question:
      "Confirm placement of fire extinguishers on Floor 2 per local code requirements.",
    category: "Safety",
  },
];

export function BlueprintWorkMenu() {
  const [activeMenu, setActiveMenu] = useState("Jobs");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Blueprint & Work Menu
      </h2>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-4 border-b border-border pb-4">
            {menuItems.map((item) => (
              <Button
                key={item}
                variant={activeMenu === item ? "default" : "ghost"}
                onClick={() => setActiveMenu(item)}
                className={
                  activeMenu === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }
              >
                {item}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Jobs Section */}
          {activeMenu === "Jobs" && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-3">
                  Job Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {jobCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedCategory === category.name
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted/30 border-border text-card-foreground hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm opacity-80">
                        {category.count} items
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blueprint Search */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Search Blueprints
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter search prompt (e.g., 'Find all electrical outlets')"
                      className="pl-10 bg-background border-border text-foreground w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Upload Blueprint
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="blueprint-upload"
                  />
                  <label
                    htmlFor="blueprint-upload"
                    className="flex flex-col items-center justify-center gap-3 px-4 py-16 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors w-full min-h-[200px]"
                  >
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-card-foreground block">
                        Upload PDF or Image
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        Drag and drop or click to browse
                      </span>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory(null);
                    }}
                    className="border-border text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Handle submit logic here
                      console.log("Submitting blueprint...");
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Discrepancies Section */}
          {activeMenu === "Discrepancies" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-card-foreground">
                  Construction Discrepancies
                </h3>
              </div>
              <div className="space-y-3">
                {discrepanciesData.map((discrepancy) => (
                  <Card
                    key={discrepancy.id}
                    className="bg-slate-900/40 border-slate-700/50 hover:border-orange-500/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-card-foreground mb-1">
                            {discrepancy.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {discrepancy.location}
                          </p>
                          <p className="text-sm text-card-foreground">
                            {discrepancy.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              discrepancy.severity === "High"
                                ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                                : "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {discrepancy.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {discrepancy.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          Status: {discrepancy.status}
                        </span>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* RFIs Section */}
          {activeMenu === "RFIs" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileQuestion className="w-5 h-5 text-sky-500" />
                <h3 className="text-lg font-semibold text-card-foreground">
                  Requests for Information
                </h3>
              </div>
              <div className="space-y-3">
                {rfisData.map((rfi) => (
                  <Card
                    key={rfi.id}
                    className="bg-slate-900/40 border-slate-700/50 hover:border-sky-500/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-sky-400 font-semibold">
                              {rfi.id}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/50">
                              {rfi.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-card-foreground mb-2">
                            {rfi.title}
                          </h4>
                          <p className="text-sm text-card-foreground mb-3">
                            {rfi.question}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Submitted by: {rfi.submittedBy}</span>
                            <span>Date: {rfi.date}</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 border ${
                            rfi.status === "Answered"
                              ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                              : "bg-blue-600/20 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {rfi.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
                        <Button size="sm" variant="outline">
                          View Response
                        </Button>
                        <Button size="sm" variant="default">
                          Reply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

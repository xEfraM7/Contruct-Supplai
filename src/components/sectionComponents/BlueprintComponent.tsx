"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  AlertTriangle,
  FileQuestion,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

const menuItems = ["Jobs", "Discrepancies", "RFIs", "Blueprints"];

const jobCategories = [
  "Electrical",
  "Concrete",
  "Roofing",
  "Steel",
  "Plumbing",
  "Framing",
  "Flooring",
  "Glazing",
  "HVAC",
  "Drywall",
  "Masonry",
  "Doors and Windows",
];

interface ExtractedItem {
  itemId: string;
  csiCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  confidence: number;
  source: string;
}

interface AnalysisResult {
  requested: string;
  discrepancies: string;
  rfis: string;
  extractedItems?: ExtractedItem[];
  discrepancyCount?: number;
  totalCostAvailable?: number;
  totalCostNeeded?: number;
  availableItemsCount?: number;
  neededItemsCount?: number;
}

interface BlueprintComponentProps {
  projectId: string;
}

export function BlueprintComponent({ projectId }: BlueprintComponentProps) {
  const [activeMenu, setActiveMenu] = useState("Jobs");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [progressStep, setProgressStep] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [blueprints, setBlueprints] = useState<
    Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      category: string;
      createdAt: string;
    }>
  >([]);
  const [loadingBlueprints, setLoadingBlueprints] = useState(true);
  const [uploadMode, setUploadMode] = useState<"new" | "existing">("new");
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(
    null
  );
  const [selectedBlueprintForView, setSelectedBlueprintForView] = useState<
    string | null
  >(null);
  const [analyses, setAnalyses] = useState<
    Array<{
      id: string;
      blueprintId: string;
      category: string;
      prompt: string;
      result: string;
      createdAt: string;
    }>
  >([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);

  const progressSteps = [
    { label: "Uploading blueprint...", duration: 1000 },
    { label: "Processing document...", duration: 2000 },
    { label: "Analyzing construction elements...", duration: 3000 },
    { label: "Detecting discrepancies...", duration: 2000 },
    { label: "Generating RFIs...", duration: 2000 },
    { label: "Finalizing analysis...", duration: 1000 },
  ];

  // Obtener información del proyecto y blueprints
  useState(() => {
    const fetchData = async () => {
      try {
        // Fetch project info
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProjectName(projectData.project.name);
        }

        // Fetch blueprints
        const blueprintsResponse = await fetch(
          `/api/blueprints?project_id=${projectId}`
        );
        if (blueprintsResponse.ok) {
          const blueprintsData = await blueprintsResponse.json();
          setBlueprints(blueprintsData.blueprints || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingBlueprints(false);
      }
    };
    fetchData();
  });

  const parseAnalysisResult = (text: string): AnalysisResult => {
    const requestedMatch = text.match(
      /\*\*Main Answer:\*\*\s*([\s\S]*?)(?=\*\*Discrepancies Found:\*\*|$)/i
    );
    const discrepanciesMatch = text.match(
      /\*\*Discrepancies Found:\*\*\s*([\s\S]*?)(?=\*\*Suggested RFIs:\*\*|$)/i
    );
    const rfisMatch = text.match(/\*\*Suggested RFIs:\*\*\s*([\s\S]*?)$/i);

    // El nuevo formato simplificado no incluye tablas de equipos ni costos
    const extractedItems: ExtractedItem[] = [];
    const totalCostAvailable = 0;
    const totalCostNeeded = 0;
    const availableItemsCount = 0;
    const neededItemsCount = 0;

    // Count discrepancies
    const discrepancyText = discrepanciesMatch?.[1]?.trim() || "";
    
    // Check if AI explicitly says there are no discrepancies
    const noDiscrepanciesPatterns = [
      /no discrepancies/i,
      /no issues/i,
      /no problems/i,
      /no conflicts/i,
      /none found/i,
      /not detected/i
    ];
    
    const hasNoDiscrepancies = noDiscrepanciesPatterns.some(pattern => 
      pattern.test(discrepancyText)
    );
    
    // Only count actual discrepancy items if AI doesn't explicitly say there are none
    const discrepancyCount = hasNoDiscrepancies ? 0 : discrepancyText
      .split("\n")
      .filter(
        (line) => line.trim().match(/^[-•*]\s/) || line.trim().match(/^\d+\./)
      ).length;

    return {
      requested: requestedMatch?.[1]?.trim() || "No main answer provided",
      discrepancies: discrepancyText || "No discrepancies found",
      rfis: rfisMatch?.[1]?.trim() || "No RFIs suggested",
      extractedItems: extractedItems.length > 0 ? extractedItems : undefined,
      discrepancyCount: discrepancyCount > 0 ? discrepancyCount : undefined,
      totalCostAvailable:
        totalCostAvailable > 0 ? totalCostAvailable : undefined,
      totalCostNeeded: totalCostNeeded > 0 ? totalCostNeeded : undefined,
      availableItemsCount:
        availableItemsCount > 0 ? availableItemsCount : undefined,
      neededItemsCount: neededItemsCount > 0 ? neededItemsCount : undefined,
    };
  };

  const simulateProgress = async () => {
    for (let i = 0; i < progressSteps.length; i++) {
      setProgressStep(i);
      await new Promise((resolve) =>
        setTimeout(resolve, progressSteps[i].duration)
      );
    }
  };

  const handleSubmit = async () => {
    if (uploadMode === "new" && (!file || !prompt)) {
      alert("Please upload a file and describe what you want to analyze.");
      return;
    }

    if (uploadMode === "existing" && (!selectedBlueprintId || !prompt)) {
      alert("Please select a blueprint and describe what you want to analyze.");
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setError(null);
    setShowProgressModal(true);
    setProgressStep(0);

    try {
      // Iniciar simulación de progreso
      const progressPromise = simulateProgress();

      let res;

      if (uploadMode === "new") {
        // Modo nuevo: subir archivo
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("category", selectedCategory || "General");
        formData.append("prompt", prompt);

        res = await fetch("/api/analyze-blueprints", {
          method: "POST",
          body: formData,
        });
      } else {
        // Modo existente: usar blueprint ya subido
        const selectedBlueprint = blueprints.find(
          (b) => b.id === selectedBlueprintId
        );
        if (!selectedBlueprint) {
          throw new Error("Blueprint not found");
        }

        // Descargar el PDF del blueprint existente
        const pdfResponse = await fetch(selectedBlueprint.fileUrl);
        const pdfBlob = await pdfResponse.blob();
        const pdfFile = new File([pdfBlob], selectedBlueprint.fileName, {
          type: "application/pdf",
        });

        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append(
          "category",
          selectedCategory || selectedBlueprint.category || "General"
        );
        formData.append("prompt", prompt);

        res = await fetch("/api/analyze-blueprints", {
          method: "POST",
          body: formData,
        });
      }

      const json = await res.json();

      // Esperar a que termine la simulación de progreso
      await progressPromise;

      if (!res.ok) {
        throw new Error(json.error || "Unexpected error");
      }

      const parsed = parseAnalysisResult(json.result);
      setAnalysisResult(parsed);
      setActiveMenu("Jobs");

      // Determinar el blueprint_id
      let blueprintId = selectedBlueprintId;

      // Guardar blueprint en Supabase solo si es modo "new"
      if (uploadMode === "new" && file) {
        const blueprintFormData = new FormData();
        blueprintFormData.append("file", file);
        blueprintFormData.append("project_id", projectId);
        blueprintFormData.append("category", selectedCategory || "General");

        const blueprintResponse = await fetch("/api/blueprints", {
          method: "POST",
          body: blueprintFormData,
        });

        if (blueprintResponse.ok) {
          const blueprintData = await blueprintResponse.json();
          blueprintId = blueprintData.blueprint.id;
        }
      }

      // Guardar el análisis
      if (blueprintId) {
        await fetch("/api/blueprint-analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blueprint_id: blueprintId,
            category: selectedCategory || "General",
            prompt,
            result: json.result,
          }),
        });
      }

      // Recargar lista de blueprints
      const blueprintsResponse = await fetch(
        `/api/blueprints?project_id=${projectId}`
      );
      if (blueprintsResponse.ok) {
        const blueprintsData = await blueprintsResponse.json();
        setBlueprints(blueprintsData.blueprints || []);
      }

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        setShowProgressModal(false);
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setShowProgressModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          {projectName || "Loading..."}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Blueprint & Work Menu
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2 sm:gap-4 border-b border-border pb-4 overflow-x-auto">
            {menuItems.map((item) => (
              <Button
                key={item}
                variant={activeMenu === item ? "default" : "ghost"}
                onClick={() => setActiveMenu(item)}
                size="sm"
                className={cn(
                  "whitespace-nowrap shrink-0",
                  activeMenu === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeMenu === "Jobs" && (
            <>
              {/* Categorías */}
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-3">
                  Job Categories
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {jobCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`p-3 sm:p-4 rounded-lg border transition-all ${
                        selectedCategory === category
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted/30 border-border text-card-foreground hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold text-center text-xs sm:text-sm">
                        {category}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Describe what you want to analyze from the blueprint
                </label>
                <Textarea
                  rows={4}
                  placeholder="E.g.: Find all electrical points and discrepancies in the HVAC distribution"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Blueprint Selection */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Blueprint
                </label>

                {/* Mode Selector */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={uploadMode === "new" ? "default" : "outline"}
                    onClick={() => {
                      setUploadMode("new");
                      setSelectedBlueprintId(null);
                    }}
                    className="flex-1"
                  >
                    Upload New
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === "existing" ? "default" : "outline"}
                    onClick={() => {
                      setUploadMode("existing");
                      setFile(null);
                    }}
                    className="flex-1"
                    disabled={blueprints.length === 0}
                  >
                    Select Existing
                  </Button>
                </div>

                {/* Upload New */}
                {uploadMode === "new" && (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      id="blueprint-upload"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="blueprint-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <p className="text-sm font-medium text-card-foreground">
                        {file ? file.name : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF files up to 25MB
                      </p>
                    </label>
                  </div>
                )}

                {/* Select Existing */}
                {uploadMode === "existing" && (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                    {blueprints.map((blueprint) => (
                      <button
                        key={blueprint.id}
                        type="button"
                        onClick={() => setSelectedBlueprintId(blueprint.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedBlueprintId === blueprint.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {blueprint.fileName}
                            </p>
                            <p className="text-xs opacity-80">
                              {new Date(
                                blueprint.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setPrompt("");
                    setFile(null);
                    setAnalysisResult(null);
                  }}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Submit"}
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 border border-red-200 rounded bg-red-50 text-sm text-red-600">
                  <h4 className="text-md font-semibold mb-2">Error:</h4>
                  {error}
                </div>
              )}

              {/* Result - Main Answer */}
              {analysisResult && (
                <>
                  <div className="mt-6 p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                    <h4 className="text-md font-semibold mb-2">Main Answer:</h4>
                    {analysisResult.requested}
                  </div>

                  {/* AI Extracted Items Section */}
                  {analysisResult.extractedItems &&
                    analysisResult.extractedItems.length > 0 && (
                      <div className="mt-6">
                        <Card className="bg-card border-border">
                          <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-semibold text-card-foreground">
                                  AI Extracted Items
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Automatically detected from blueprints
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  // Export to CSV functionality with budget breakdown
                                  const totalCostAvailable =
                                    analysisResult.totalCostAvailable || 0;
                                  const totalCostNeeded =
                                    analysisResult.totalCostNeeded || 0;
                                  const availableCount =
                                    analysisResult.availableItemsCount || 0;
                                  const neededCount =
                                    analysisResult.neededItemsCount || 0;

                                  const csv = [
                                    [
                                      "ITEM ID",
                                      "CSI CODE",
                                      "DESCRIPTION",
                                      "QTY",
                                      "UNIT",
                                      "UNIT COST",
                                      "TOTAL",
                                      "CONFIDENCE",
                                      "SOURCE",
                                    ],
                                    ...analysisResult.extractedItems!.map(
                                      (item) => [
                                        item.itemId,
                                        item.csiCode,
                                        item.description,
                                        item.quantity,
                                        item.unit,
                                        `$${item.unitCost.toFixed(2)}`,
                                        `$${item.total.toFixed(2)}`,
                                        `${item.confidence}%`,
                                        item.source,
                                      ]
                                    ),
                                    [""], // Empty row
                                    ["PROJECT BUDGET SUMMARY"],
                                    [
                                      "Total Project Cost",
                                      "",
                                      "",
                                      "",
                                      "",
                                      "",
                                      `$${(
                                        totalCostAvailable + totalCostNeeded
                                      ).toFixed(2)}`,
                                      "",
                                      "",
                                    ],
                                    [
                                      "From Inventory",
                                      "",
                                      "",
                                      availableCount,
                                      "items",
                                      "",
                                      `$${totalCostAvailable.toFixed(2)}`,
                                      "",
                                      "",
                                    ],
                                    [
                                      "Need to Acquire",
                                      "",
                                      "",
                                      neededCount,
                                      "items",
                                      "",
                                      `$${totalCostNeeded.toFixed(2)}`,
                                      "",
                                      "",
                                    ],
                                  ]
                                    .map((row) => row.join(","))
                                    .join("\n");

                                  const blob = new Blob([csv], {
                                    type: "text/csv",
                                  });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = "blueprint-analysis-budget.csv";
                                  a.click();
                                }}
                              >
                                Export CSV
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                              <table className="w-full min-w-[900px]">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Item ID
                                    </th>
                                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      CSI Code
                                    </th>
                                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Description
                                    </th>
                                    <th className="text-right py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      QTY
                                    </th>
                                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Unit
                                    </th>
                                    <th className="text-right py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Unit Cost
                                    </th>
                                    <th className="text-right py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Total
                                    </th>
                                    <th className="text-center py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Confidence
                                    </th>
                                    <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                      Source
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {analysisResult.extractedItems.map((item) => (
                                    <tr
                                      key={item.itemId}
                                      className="border-b border-border hover:bg-muted/30 transition-colors"
                                    >
                                      <td className="py-3 px-2 sm:px-4">
                                        <span className="text-sm font-medium text-card-foreground">
                                          {item.itemId}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4">
                                        <span className="text-sm text-card-foreground">
                                          {item.csiCode}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4">
                                        <span className="text-sm text-card-foreground">
                                          {item.description}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4 text-right">
                                        <span className="text-sm text-card-foreground">
                                          {item.quantity.toFixed(2)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4">
                                        <span className="text-sm text-card-foreground">
                                          {item.unit}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4 text-right">
                                        <span className="text-sm text-card-foreground">
                                          ${item.unitCost.toFixed(2)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4 text-right">
                                        <span className="text-sm font-medium text-card-foreground">
                                          ${item.total.toFixed(2)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                              className={cn(
                                                "h-full",
                                                item.confidence >= 90
                                                  ? "bg-green-500"
                                                  : "bg-orange-500"
                                              )}
                                              style={{
                                                width: `${item.confidence}%`,
                                              }}
                                            />
                                          </div>
                                          <span className="text-xs font-medium text-card-foreground">
                                            {item.confidence}%
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-2 sm:px-4">
                                        <span className="text-xs text-muted-foreground">
                                          {item.source}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Budget Summary */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-lg font-semibold text-blue-900 mb-1">
                                      Project Budget Summary
                                    </h4>
                                    <p className="text-sm text-blue-700">
                                      Cost breakdown for extracted items
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-900">
                                      $
                                      {(
                                        (analysisResult.totalCostAvailable ||
                                          0) +
                                        (analysisResult.totalCostNeeded || 0)
                                      ).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      Total Project Cost
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                                  {/* Available Items */}
                                  {analysisResult.totalCostAvailable &&
                                    analysisResult.totalCostAvailable > 0 && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-semibold text-green-900">
                                            From Inventory
                                          </h5>
                                          <span className="text-lg font-bold text-green-900">
                                            $
                                            {analysisResult.totalCostAvailable.toFixed(
                                              2
                                            )}
                                          </span>
                                        </div>
                                        <p className="text-sm text-green-700">
                                          {analysisResult.availableItemsCount ||
                                            0}{" "}
                                          items available in inventory
                                        </p>
                                      </div>
                                    )}

                                  {/* Needed Items */}
                                  {analysisResult.totalCostNeeded &&
                                    analysisResult.totalCostNeeded > 0 && (
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-semibold text-orange-900">
                                            Need to Acquire
                                          </h5>
                                          <span className="text-lg font-bold text-orange-900">
                                            $
                                            {analysisResult.totalCostNeeded.toFixed(
                                              2
                                            )}
                                          </span>
                                        </div>
                                        <p className="text-sm text-orange-700">
                                          {analysisResult.neededItemsCount || 0}{" "}
                                          items to purchase/rent
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>

                            {/* Discrepancies Alert */}
                            {analysisResult.discrepancyCount &&
                              analysisResult.discrepancyCount > 0 && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-red-900 mb-1">
                                        {analysisResult.discrepancyCount}{" "}
                                        Discrepancies Detected
                                      </h4>
                                      <p className="text-sm text-red-700 mb-3">
                                        Our AI has identified conflicts between
                                        blueprints and schedules
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() =>
                                          setActiveMenu("Discrepancies")
                                        }
                                      >
                                        Review Discrepancies
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                </>
              )}
            </>
          )}

          {activeMenu === "Discrepancies" && (
            <div className="min-h-[400px]">
              {analysisResult ? (
                <div className="p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                  <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Detected Discrepancies:
                  </h4>
                  {analysisResult.discrepancies}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No analysis available. Please analyze a blueprint first in
                    the Jobs section.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeMenu === "RFIs" && (
            <div className="min-h-[400px]">
              {analysisResult ? (
                <div className="p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                  <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-blue-600" />
                    RFIs (Requests for Information):
                  </h4>
                  {analysisResult.rfis}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No analysis available. Please analyze a blueprint first in
                    the Jobs section.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeMenu === "Blueprints" && (
            <div className="min-h-[400px]">
              {loadingBlueprints ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : blueprints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No blueprints uploaded yet. Upload and analyze a blueprint
                    in the Jobs section.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Lista de Blueprints */}
                  <div className="lg:col-span-1 space-y-2">
                    <h3 className="text-sm font-semibold text-card-foreground mb-3">
                      Uploaded Blueprints
                    </h3>
                    {blueprints.map((blueprint) => (
                      <button
                        key={blueprint.id}
                        type="button"
                        onClick={async () => {
                          setSelectedBlueprintForView(blueprint.id);
                          setLoadingAnalyses(true);
                          try {
                            const response = await fetch(
                              `/api/blueprint-analyses?blueprint_id=${blueprint.id}`
                            );
                            if (response.ok) {
                              const data = await response.json();
                              setAnalyses(data.analyses || []);
                            }
                          } catch (err) {
                            console.error("Error loading analyses:", err);
                          } finally {
                            setLoadingAnalyses(false);
                          }
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedBlueprintForView === blueprint.id
                            ? "bg-primary/10 border-2 border-primary"
                            : "border border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-primary" />
                          <p className="font-medium text-card-foreground truncate">
                            {blueprint.fileName}
                          </p>
                        </div>
                        {blueprint.category && (
                          <p className="text-xs text-muted-foreground">
                            {blueprint.category}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(blueprint.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Análisis del Blueprint Seleccionado */}
                  <div className="lg:col-span-2">
                    {!selectedBlueprintForView ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Select a blueprint to view its analyses
                        </p>
                      </div>
                    ) : loadingAnalyses ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    ) : analyses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No analyses for this blueprint yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-card-foreground mb-3">
                          Analyses ({analyses.length})
                        </h3>
                        {analyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="p-4 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                {analysis.category && (
                                  <Badge variant="secondary" className="mb-2">
                                    {analysis.category}
                                  </Badge>
                                )}
                                <p className="text-sm text-muted-foreground mb-2">
                                  <span className="font-medium">Prompt:</span>{" "}
                                  {analysis.prompt}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    analysis.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const parsed = parseAnalysisResult(
                                    analysis.result
                                  );
                                  setAnalysisResult(parsed);
                                  setActiveMenu("Jobs");
                                }}
                              >
                                View Analysis
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center">
              Analyzing Blueprint
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Animated Icon */}
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10"></div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="w-full space-y-3">
                {progressSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index === progressStep
                        ? "bg-primary/10 border border-primary/20"
                        : index < progressStep
                        ? "bg-muted/50"
                        : "bg-muted/20"
                    }`}
                  >
                    {index < progressStep ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : index === progressStep ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        index === progressStep
                          ? "text-foreground font-medium"
                          : index < progressStep
                          ? "text-muted-foreground line-through"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="w-full">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        ((progressStep + 1) / progressSteps.length) * 100
                      }%`,
                    }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {Math.round(
                    ((progressStep + 1) / progressSteps.length) * 100
                  )}
                  % Complete
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

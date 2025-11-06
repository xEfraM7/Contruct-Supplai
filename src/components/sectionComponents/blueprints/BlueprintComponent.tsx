"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
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
import { Badge } from "../../ui/badge";
import { cn } from "@/lib/utils";
import { themeColors } from "@/lib/theme";

// Import separated modules
import {
  menuItems,
  jobCategories,
  categoryPrompts,
  progressSteps,
  type BlueprintComponentProps,
  type BlueprintFormData,
  type AnalysisResult,
  type Blueprint,
  type Analysis,
  parseAnalysisResult,
  simulateProgress,
  useProject,
  useBlueprints,
  useAnalyses,
  useAnalyzeBlueprint,
} from "./index";

export function BlueprintComponent({ projectId }: BlueprintComponentProps) {
  const [activeMenu, setActiveMenu] = useState("Jobs");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [progressStep, setProgressStep] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedBlueprintForView, setSelectedBlueprintForView] = useState<
    string | null
  >(null);
  const hasSetInitialMode = useRef(false);

  // Use custom hooks
  const { data: projectData } = useProject(projectId);
  const {
    data: blueprintsData,
    isLoading: loadingBlueprints,
    error: blueprintsError,
  } = useBlueprints(projectId);
  const blueprints = blueprintsData?.blueprints || [];

  // React Hook Form
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BlueprintFormData>({
    defaultValues: {
      category: "",
      prompt: "",
      file: null,
      uploadMode: blueprints.length > 0 ? "existing" : "new",
      selectedBlueprintId: null,
    },
  });

  // Watch form values
  const selectedCategory = watch("category");
  const uploadMode = watch("uploadMode");
  const selectedBlueprintId = watch("selectedBlueprintId");
  const fileList = watch("file");

  // Update uploadMode when blueprints are loaded (only once on initial load)
  useEffect(() => {
    if (
      !loadingBlueprints &&
      blueprints.length > 0 &&
      !hasSetInitialMode.current
    ) {
      setValue("uploadMode", "existing");
      hasSetInitialMode.current = true;
    }
  }, [loadingBlueprints, blueprints.length, setValue]);

  const { data: analysesData, isLoading: loadingAnalyses } = useAnalyses(
    selectedBlueprintForView
  );

  const analyses = analysesData?.analyses || [];
  const projectName = projectData?.project?.name || "";

  // Mutation for analyzing blueprints
  const analyzeBlueprintMutation = useAnalyzeBlueprint(projectId, (result) => {
    const parsed = parseAnalysisResult(result);
    setAnalysisResult(parsed);
    setActiveMenu("Jobs");
    setTimeout(() => {
      setShowProgressModal(false);
    }, 500);
  });

  const onSubmit = async (data: BlueprintFormData) => {
    setAnalysisResult(null);
    setShowProgressModal(true);
    setProgressStep(0);

    try {
      // Iniciar simulación de progreso
      const progressPromise = simulateProgress(progressSteps, setProgressStep);

      const blueprintIdToUse = data.selectedBlueprintId;
      let fileUrl: string;
      let fileName: string;

      if (data.uploadMode === "new") {
        if (!data.file || data.file.length === 0) {
          throw new Error("Please upload a file");
        }

        // Subir archivo directamente a Supabase Storage desde el cliente
        const file = data.file[0];
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Sanitizar nombre del archivo (remover caracteres especiales y espacios)
        const sanitizedFileName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, "_") // Reemplazar caracteres especiales con _
          .replace(/_{2,}/g, "_") // Reemplazar múltiples _ con uno solo
          .replace(/^_|_$/g, ""); // Remover _ al inicio y final

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const filePath = `temp/${user.id}/${timestamp}-${sanitizedFileName}`;

        console.log("[UPLOAD] Subiendo archivo:", {
          original: file.name,
          sanitized: sanitizedFileName,
          path: filePath,
        });

        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("blueprints")
          .upload(filePath, file);

        if (uploadError) {
          console.error("[UPLOAD] Error:", uploadError);
          throw uploadError;
        }

        // Obtener URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from("blueprints").getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      } else {
        // Modo existente: usar blueprint ya subido
        const selectedBlueprint = blueprints.find(
          (b: Blueprint) => b.id === data.selectedBlueprintId
        );
        if (!selectedBlueprint) {
          throw new Error("Blueprint not found");
        }

        fileUrl = selectedBlueprint.fileUrl;
        fileName = selectedBlueprint.fileName;
      }

      // Esperar a que termine la simulación de progreso
      await progressPromise;

      // Ejecutar la mutation solo con la URL
      await analyzeBlueprintMutation.mutateAsync({
        fileUrl,
        fileName,
        prompt: data.prompt,
        category: data.category || "General",
        blueprintId: blueprintIdToUse || undefined,
        uploadMode: data.uploadMode,
      });
    } catch {
      setShowProgressModal(false);
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
                      type="button"
                      onClick={() => {
                        setValue("category", category);
                        setValue("prompt", categoryPrompts[category] || "");
                      }}
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
                  {...register("prompt", { required: "Prompt is required" })}
                  className="w-full"
                />
                {errors.prompt && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.prompt.message}
                  </p>
                )}
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
                      setValue("uploadMode", "new");
                      setValue("selectedBlueprintId", null);
                    }}
                    className="flex-1"
                  >
                    Upload New
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === "existing" ? "default" : "outline"}
                    onClick={() => {
                      setValue("uploadMode", "existing");
                      setValue("file", null);
                    }}
                    className="flex-1"
                    disabled={blueprints.length === 0}
                  >
                    Select Existing
                  </Button>
                </div>

                {/* Upload New */}
                {uploadMode === "new" && (
                  <div key="upload-new" className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      id="blueprint-upload"
                      {...register("file", {
                        required:
                          uploadMode === "new" ? "File is required" : false,
                      })}
                      className="hidden"
                    />
                    <label
                      htmlFor="blueprint-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <p className="text-sm font-medium text-card-foreground">
                        {fileList && fileList.length > 0
                          ? fileList[0].name
                          : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF files up to 150MB
                      </p>
                    </label>
                    {errors.file && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.file.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Select Existing */}
                {uploadMode === "existing" && (
                  <div key="select-existing" className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                    {blueprints.map((blueprint: Blueprint) => (
                      <button
                        key={blueprint.id}
                        type="button"
                        onClick={() =>
                          setValue("selectedBlueprintId", blueprint.id)
                        }
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
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setAnalysisResult(null);
                  }}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleFormSubmit(onSubmit)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={analyzeBlueprintMutation.isPending}
                >
                  {analyzeBlueprintMutation.isPending
                    ? "Analyzing..."
                    : "Submit"}
                </Button>
              </div>

              {/* Error */}
              {analyzeBlueprintMutation.error && (
                <div
                  className={`mt-6 p-4 rounded text-sm border ${themeColors.status.error.bg} ${themeColors.status.error.text} ${themeColors.status.error.border}`}
                >
                  <h4 className="text-md font-semibold mb-2">Error:</h4>
                  {analyzeBlueprintMutation.error.message}
                </div>
              )}

              {blueprintsError && (
                <div
                  className={`mt-6 p-4 rounded text-sm border ${themeColors.status.error.bg} ${themeColors.status.error.text} ${themeColors.status.error.border}`}
                >
                  <h4 className="text-md font-semibold mb-2">
                    Error loading blueprints:
                  </h4>
                  {blueprintsError.message}
                </div>
              )}

              {/* Result - Requested */}
              {analysisResult && (
                <>
                  <div className="mt-6 p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                    <h4 className="text-md font-semibold mb-2">Takeoff:</h4>
                    {analysisResult.requested}
                  </div>

                  {/* Technical Summary */}
                  {analysisResult.technicalSummary && (
                    <div className="mt-6 p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                      <h4 className="text-md font-semibold mb-2">Technical Summary:</h4>
                      {analysisResult.technicalSummary}
                    </div>
                  )}

                  {/* Budget Summary */}
                  {analysisResult.budgetSummary && (
                    <div className="mt-6 p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                      <h4 className="text-md font-semibold mb-2">Budget Summary:</h4>
                      {analysisResult.budgetSummary}
                    </div>
                  )}

                  {/* AI Extracted Items Section */}
                  {analysisResult.extractedItems &&
                    analysisResult.extractedItems.length > 0 &&
                    (() => {
                      // Define types for grouping
                      interface GroupedItem {
                        itemId: string;
                        description: string;
                        quantity: number;
                        unitCost: number;
                        total: number;
                        confidence: number;
                        source: string;
                        count: number;
                        totalWeightedConfidence: number;
                        totalWeightedUnitCost: number;
                      }

                      interface ConsolidatedItem {
                        itemId: string;
                        description: string;
                        quantity: number;
                        unitCost: number;
                        total: number;
                        confidence: number;
                        source: string;
                      }

                      // Group items by description
                      const groupedItems =
                        analysisResult.extractedItems!.reduce((acc, item) => {
                          const key = item.description;
                          if (!acc[key]) {
                            acc[key] = {
                              itemId: item.itemId,
                              description: item.description,
                              quantity: 0,
                              unitCost: 0,
                              total: 0,
                              confidence: 0,
                              source: item.source,
                              count: 0,
                              totalWeightedConfidence: 0,
                              totalWeightedUnitCost: 0,
                            };
                          }
                          acc[key].quantity += item.quantity;
                          acc[key].total += item.total;
                          acc[key].totalWeightedConfidence +=
                            item.confidence * item.quantity;
                          acc[key].totalWeightedUnitCost +=
                            item.unitCost * item.quantity;
                          acc[key].count += 1;
                          return acc;
                        }, {} as Record<string, GroupedItem>);

                      // Calculate weighted averages
                      const consolidatedItems: ConsolidatedItem[] =
                        Object.values(groupedItems).map((group) => ({
                          itemId: group.itemId,
                          description: group.description,
                          quantity: group.quantity,
                          unitCost:
                            group.totalWeightedUnitCost / group.quantity,
                          total: group.total,
                          confidence: Math.round(
                            group.totalWeightedConfidence / group.quantity
                          ),
                          source: group.source,
                        }));

                      return (
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
                                        "DESCRIPTION",
                                        "QTY",
                                        "UNIT COST",
                                        "TOTAL",
                                        "CONFIDENCE",
                                        "SOURCE",
                                      ],
                                      ...analysisResult.extractedItems!.map(
                                        (item) => [
                                          item.itemId,
                                          `"${item.description.replace(/"/g, '""')}"`,
                                          item.quantity.toFixed(2),
                                          `$${item.unitCost.toFixed(2)}`,
                                          `$${item.total.toFixed(2)}`,
                                          `${item.confidence}%`,
                                          item.source,
                                        ]
                                      ),
                                      [""],
                                      ["PROJECT BUDGET SUMMARY"],
                                      [
                                        "Total Project Cost",
                                        `$${(
                                          totalCostAvailable + totalCostNeeded
                                        ).toFixed(2)}`,
                                      ],
                                      [
                                        "From Inventory",
                                        `$${totalCostAvailable.toFixed(
                                          2
                                        )} (${availableCount} items)`,
                                      ],
                                      [
                                        "Need to Acquire",
                                        `$${totalCostNeeded.toFixed(
                                          2
                                        )} (${neededCount} items)`,
                                      ],
                                    ]
                                      .map((row) => row.join(","))
                                      .join("\n");

                                    // Add UTF-8 BOM for proper encoding in Excel
                                    const BOM = "\uFEFF";
                                    const blob = new Blob([BOM + csv], {
                                      type: "text/csv;charset=utf-8;",
                                    });
                                    const url =
                                      window.URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download =
                                      "blueprint-analysis-budget.csv";
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                  }}
                                >
                                  Export CSV
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                                <table className="w-full min-w-[700px]">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                        Item ID
                                      </th>
                                      <th className="text-left py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                        Description
                                      </th>
                                      <th className="text-right py-3 px-2 sm:px-4 text-xs font-semibold text-muted-foreground uppercase">
                                        QTY
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
                                    {consolidatedItems.map((item) => (
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
                                            {item.description}
                                          </span>
                                        </td>
                                        <td className="py-3 px-2 sm:px-4 text-right">
                                          <span className="text-sm text-card-foreground">
                                            {item.quantity.toFixed(2)}
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
                                                    ? themeColors.confidence
                                                        .high
                                                    : themeColors.confidence
                                                        .medium
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
                              <div
                                className={`mt-6 p-4 rounded-lg border ${themeColors.cards.budget.bg} ${themeColors.cards.budget.border}`}
                              >
                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                      <h4
                                        className={`text-lg font-semibold mb-1 ${themeColors.cards.budget.title}`}
                                      >
                                        Project Budget Summary
                                      </h4>
                                      <p
                                        className={`text-sm ${themeColors.cards.budget.text}`}
                                      >
                                        Cost breakdown for extracted items
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div
                                        className={`text-2xl font-bold ${themeColors.cards.budget.title}`}
                                      >
                                        $
                                        {(
                                          (analysisResult.totalCostAvailable ||
                                            0) +
                                          (analysisResult.totalCostNeeded || 0)
                                        ).toFixed(2)}
                                      </div>
                                      <div
                                        className={`text-xs ${themeColors.cards.budget.text}`}
                                      >
                                        Total Project Cost
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detailed Breakdown */}
                                  <div
                                    className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t ${themeColors.cards.budget.border}`}
                                  >
                                    {/* Available Items */}
                                    {analysisResult.totalCostAvailable &&
                                      analysisResult.totalCostAvailable > 0 && (
                                        <div
                                          className={`rounded-lg p-3 border ${themeColors.cards.inventory.bg} ${themeColors.cards.inventory.border}`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <h5
                                              className={`font-semibold ${themeColors.cards.inventory.title}`}
                                            >
                                              From Inventory
                                            </h5>
                                            <span
                                              className={`text-lg font-bold ${themeColors.cards.inventory.title}`}
                                            >
                                              $
                                              {analysisResult.totalCostAvailable.toFixed(
                                                2
                                              )}
                                            </span>
                                          </div>
                                          <p
                                            className={`text-sm ${themeColors.cards.inventory.text}`}
                                          >
                                            {analysisResult.availableItemsCount ||
                                              0}{" "}
                                            items available in inventory
                                          </p>
                                        </div>
                                      )}

                                    {/* Needed Items */}
                                    {analysisResult.totalCostNeeded &&
                                      analysisResult.totalCostNeeded > 0 && (
                                        <div
                                          className={`rounded-lg p-3 border ${themeColors.cards.needed.bg} ${themeColors.cards.needed.border}`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <h5
                                              className={`font-semibold ${themeColors.cards.needed.title}`}
                                            >
                                              Need to Acquire
                                            </h5>
                                            <span
                                              className={`text-lg font-bold ${themeColors.cards.needed.title}`}
                                            >
                                              $
                                              {analysisResult.totalCostNeeded.toFixed(
                                                2
                                              )}
                                            </span>
                                          </div>
                                          <p
                                            className={`text-sm ${themeColors.cards.needed.text}`}
                                          >
                                            {analysisResult.neededItemsCount ||
                                              0}{" "}
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
                                  <div
                                    className={`mt-6 p-4 rounded-lg border ${themeColors.cards.alert.bg} ${themeColors.cards.alert.border}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <AlertTriangle
                                        className={`w-5 h-5 mt-0.5 shrink-0 ${themeColors.cards.alert.icon}`}
                                      />
                                      <div className="flex-1">
                                        <h4
                                          className={`text-sm font-semibold mb-1 ${themeColors.cards.alert.title}`}
                                        >
                                          {analysisResult.discrepancyCount}{" "}
                                          Discrepancies Detected
                                        </h4>
                                        <p
                                          className={`text-sm mb-3 ${themeColors.cards.alert.text}`}
                                        >
                                          Our AI has identified conflicts
                                          between blueprints and schedules
                                        </p>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className={
                                            themeColors.interactive.delete
                                              .button
                                          }
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
                      );
                    })()}
                </>
              )}
            </>
          )}
          {/* aqui */}
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
                    <FileQuestion
                      className={`w-5 h-5 ${themeColors.status.info.icon}`}
                    />
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
                    {blueprints.map((blueprint: Blueprint) => (
                      <button
                        key={blueprint.id}
                        type="button"
                        onClick={() => {
                          setSelectedBlueprintForView(blueprint.id);
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
                        {analyses.map((analysis: Analysis) => (
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
                      <CheckCircle2
                        className={`w-5 h-5 flex-shrink-0 ${themeColors.status.success.icon}`}
                      />
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

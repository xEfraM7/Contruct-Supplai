"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, AlertTriangle, FileQuestion } from "lucide-react";

const menuItems = ["Jobs", "Discrepancies", "RFIs"];

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

interface AnalysisResult {
  requested: string;
  discrepancies: string;
  rfis: string;
}

export function BlueprintComponent() {
  const [activeMenu, setActiveMenu] = useState("Jobs");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseAnalysisResult = (text: string): AnalysisResult => {
    const requestedMatch = text.match(
      /##\s*LO SOLICITADO\s*([\s\S]*?)(?=##\s*DISCREPANCIES|$)/i
    );
    const discrepanciesMatch = text.match(
      /##\s*DISCREPANCIES\s*([\s\S]*?)(?=##\s*RFIs|$)/i
    );
    const rfisMatch = text.match(/##\s*RFIs\s*([\s\S]*?)$/i);

    return {
      requested: requestedMatch?.[1]?.trim() || "Not available",
      discrepancies:
        discrepanciesMatch?.[1]?.trim() || "No discrepancies detected",
      rfis: rfisMatch?.[1]?.trim() || "No RFIs required",
    };
  };

  const handleSubmit = async () => {
    if (!file || !prompt) {
      alert("Please upload a file and describe what you want to analyze.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", selectedCategory || "General");
    formData.append("prompt", prompt);

    setLoading(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze-blueprints", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Unexpected error");
      }

      const parsed = parseAnalysisResult(json.result);
      setAnalysisResult(parsed);
      setActiveMenu("Jobs"); // Keep in Jobs to view "Requested"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
          {activeMenu === "Jobs" && (
            <>
              {/* Categorías */}
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-3">
                  Job Categories
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {jobCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedCategory === category
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted/30 border-border text-card-foreground hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold text-center">{category}</p>
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

              {/* Upload */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Upload Blueprint
                </label>
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

              {/* Result - Requested */}
              {analysisResult && (
                <div className="mt-6 p-4 border rounded bg-muted/30 whitespace-pre-wrap text-sm">
                  <h4 className="text-md font-semibold mb-2">Requested:</h4>
                  {analysisResult.requested}
                </div>
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
                    No analysis available. Please analyze a blueprint first in the Jobs section.
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
                    No analysis available. Please analyze a blueprint first in the Jobs section.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

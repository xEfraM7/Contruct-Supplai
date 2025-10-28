"use client";

import { useState } from "react";

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

export function useBlueprintLogic() {
  const [selectedMenu, setSelectedMenu] = useState("Jobs");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedItems] = useState<ExtractedItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/blueprints/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setSelectedFile(null);
        }, 1000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCategory && !customPrompt) return;

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          customPrompt: customPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.result);
        setIsAnalysisModalOpen(true);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    selectedMenu,
    setSelectedMenu,
    selectedFile,
    setSelectedFile,
    isUploading,
    uploadProgress,
    extractedItems,
    isAnalyzing,
    selectedCategory,
    setSelectedCategory,
    customPrompt,
    setCustomPrompt,
    analysisResult,
    isAnalysisModalOpen,
    setIsAnalysisModalOpen,
    menuItems,
    jobCategories,
    handleFileSelect,
    handleUpload,
    handleAnalyze,
  };
}

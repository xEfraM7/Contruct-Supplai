"use client";

import { useState, useEffect } from "react";
import type { Call } from "@/types/call";

export function useCallHistoryDialog(subcontractorId: string, open: boolean) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (open && subcontractorId) {
      fetchCalls();
    }
  }, [open, subcontractorId]);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/calls/subcontractor/${subcontractorId}`);
      const data = await response.json();

      if (response.ok && data.calls) {
        setCalls(data.calls);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCalls();
    setIsRefreshing(false);
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  return {
    calls,
    isLoading,
    isRefreshing,
    handleRefresh,
    formatDuration,
    formatDate,
  };
}

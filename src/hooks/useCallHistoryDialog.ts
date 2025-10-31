import { useState, useEffect, useCallback } from "react";
import type { Call } from "@/types/call";

export function useCallHistoryDialog(contactId: string, open: boolean) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/calls/contact/${contactId}`);
      const data = await response.json();

      if (response.ok) {
        setCalls(data.calls || []);
      } else {
        console.error("Error fetching calls:", data.error);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (open && contactId) {
      fetchCalls();
    }
  }, [open, contactId, fetchCalls]);

  const handleRefresh = async () => {
    await fetchCalls();
  };

  return {
    calls,
    isLoading,
    handleRefresh,
  };
}

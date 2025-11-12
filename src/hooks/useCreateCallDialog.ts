import { useState } from "react";
import { toast } from "sonner";

interface CreateCallDialogProps {
  contactId: string;
  contactPhone: string;
  onCallCreated?: () => void;
}

export function useCreateCallDialog({
  contactId,
  contactPhone,
  onCallCreated,
}: CreateCallDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCall = async () => {
    if (!selectedAgentId || !contactPhone) {
      toast.error("Please select an agent");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/calls/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_number: contactPhone,
          agent_id: selectedAgentId,
          contact_id: contactId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create call");
      }

      toast.success("Call created successfully");
      onCallCreated?.();
    } catch (error) {
      console.error("Error creating call:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create call"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return {
    selectedAgentId,
    setSelectedAgentId,
    isCreating,
    handleCreateCall,
  };
}

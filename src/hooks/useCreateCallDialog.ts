"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Agent {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
}

interface CreateCallDialogProps {
  subcontractorId: string;
  subcontractorPhone: string;
  onCallCreated?: () => void;
}

export function useCreateCallDialog({
  subcontractorId,
  subcontractorPhone,
  onCallCreated,
}: CreateCallDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchPhoneNumber();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();

      if (response.ok && data.agents) {
        const activeAgents = data.agents.filter((agent: Agent) => agent.agent_id);
        setAgents(activeAgents);
        if (activeAgents.length > 0) {
          setSelectedAgentId(activeAgents[0].agent_id);
        }
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const fetchPhoneNumber = async () => {
    try {
      const response = await fetch("/api/calls/phone-number");
      const data = await response.json();

      if (response.ok && data.phone_number) {
        setFromNumber(data.phone_number);
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
    }
  };

  const handleCreateCall = async () => {
    if (!selectedAgentId || !fromNumber || !subcontractorPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingCall(true);

    try {
      const response = await fetch("/api/calls/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_number: fromNumber,
          to_number: subcontractorPhone,
          agent_id: selectedAgentId,
          subcontractor_id: subcontractorId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Call initiated successfully!");
        if (onCallCreated) {
          onCallCreated();
        }
      } else {
        toast.error(data.error || "Failed to create call");
      }
    } catch (error) {
      console.error("Error creating call:", error);
      toast.error("Failed to create call");
    } finally {
      setIsCreatingCall(false);
    }
  };

  return {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    fromNumber,
    setFromNumber,
    isLoadingAgents,
    isCreatingCall,
    handleCreateCall,
  };
}

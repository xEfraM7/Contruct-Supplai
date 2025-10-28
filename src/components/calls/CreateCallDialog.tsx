"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Loader2, AlertCircle } from "lucide-react";
import { useAgents } from "@/lib/hooks/use-agents";

interface Agent {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
}

interface CreateCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcontractorId: string;
  subcontractorName: string;
  subcontractorPhone: string;
  onCallCreated?: () => void;
}

export function CreateCallDialog({
  open,
  onOpenChange,
  subcontractorId,
  subcontractorName,
  subcontractorPhone,
  onCallCreated,
}: CreateCallDialogProps) {
  const { data: agentsData, isLoading: isLoadingAgents } = useAgents();
  const agents = agentsData?.agents || [];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromNumber, setFromNumber] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [error, setError] = useState("");

  const fetchPhoneNumber = async () => {
    try {
      const response = await fetch("/api/calls/phone-number");
      const result = await response.json();
      if (result.phone_number) {
        setFromNumber(result.phone_number);
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPhoneNumber();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fromNumber || !selectedAgentId) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/calls/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_number: fromNumber,
          to_number: subcontractorPhone,
          agent_id: selectedAgentId,
          subcontractor_id: subcontractorId,
          metadata: {
            subcontractor_name: subcontractorName,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onOpenChange(false);
        setFromNumber("");
        setSelectedAgentId("");
        if (onCallCreated) {
          onCallCreated();
        }
      } else {
        setError(result.error || "Failed to create call");
      }
    } catch (error) {
      console.error("Error creating call:", error);
      setError("An error occurred while creating the call");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Call {subcontractorName}</DialogTitle>
        </DialogHeader>

        {isLoadingAgents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  No AI Agents Found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You need to create an AI agent before making calls.
                </p>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    window.location.href = "/agents";
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Go to Agents
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to_number">To (Subcontractor)</Label>
              <Input
                id="to_number"
                type="tel"
                value={subcontractorPhone}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_number">From (Your Number)</Label>
              <Input
                id="from_number"
                type="tel"
                value={fromNumber}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Configured number: {fromNumber || "Loading..."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Select AI Agent *</Label>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.agent_id}>
                      {agent.agent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The AI agent that will handle this call
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Start Call
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

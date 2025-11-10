"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateCallDialog } from "@/hooks/useCreateCallDialog";
import { useAgents } from "@/lib/hooks/use-agents";
import { CreateCallDialogProps } from "./types/call-types";



export function CreateCallDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  contactPhone,
  onCallCreated,
}: CreateCallDialogProps) {
  const { data: agents, isLoading: agentsLoading } = useAgents();

  const {
    selectedAgentId,
    setSelectedAgentId,
    fromNumber,
    setFromNumber,
    isCreating,
    handleCreateCall,
  } = useCreateCallDialog({
    contactId,
    contactPhone,
    onCallCreated: () => {
      onCallCreated?.();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Call to {contactName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>To Number</Label>
            <Input value={contactPhone} disabled />
          </div>

          <div className="space-y-2">
            <Label>From Number</Label>
            <Input
              placeholder="+1234567890"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>AI Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agentsLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading agents...
                  </div>
                ) : agents && agents.length > 0 ? (
                  agents.map((agent: { agent_id: string; agent_name: string }) => (
                    <SelectItem key={agent.agent_id} value={agent.agent_id}>
                      {agent.agent_name || agent.agent_id}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No agents available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCall} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Call"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Loader2, Phone } from "lucide-react";
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
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={contactPhone} 
                disabled 
                className="bg-muted/50 pl-10" 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Contact phone number
            </p>
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
            <p className="text-xs text-muted-foreground">
              Select the AI agent to handle this call
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-card-foreground">
                  Calling from your configured number
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The call will be made from your Retell phone number configured in settings
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCall} disabled={isCreating || !selectedAgentId}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Create Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

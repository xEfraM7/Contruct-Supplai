"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface CreateLlmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (llmId: string) => void;
}

const DEFAULT_PROMPT = `Act as a phone-based AI assistant working within a construction management application, representing the project manager of an ongoing construction project.

Your role is to call subcontractors who are assigned to different areas of the project (e.g., electrical, plumbing, structural, etc.) and follow up on their progress.

During each call, follow this structure:

1. Professional and clear introduction: Introduce yourself as the assistant of the project manager {{project_manager_name}}.

2. Quick verification: Confirm you're speaking with the person responsible for the subcontracted work.

3. Project context: Mention the name or location of the project if available.

4. Reason for the call:
   - If there is a specific task assigned: Ask if it has been completed, what the current status is, if any blockers have come up, and when they expect to finish.
   - If there is no specific task assigned: Ask for a general update on their area of responsibility (progress, delays, needs).

5. Record key information: Summarize the critical points and confirm that the report will be forwarded to the project manager.

6. Professional closing: Thank them for their time and let them know that you will follow up again if needed.

Keep a professional but friendly tone. Be direct, focused on gathering clear and actionable information. If the subcontractor mentions any blockers or requests for coordination with other teams, make sure to capture and report that as well.`;

export function CreateLlmDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateLlmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    model: "gpt-4o-mini",
    general_prompt: DEFAULT_PROMPT,
    start_speaker: "agent",
    begin_message:
      "Hello, this is the AI assistant calling on behalf of the project manager. Am I speaking with the person responsible for the subcontracted work?",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.general_prompt) {
      toast.error("General prompt is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/agents/llms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("LLM created successfully");
        onSuccess(data.llm.llm_id);
        onOpenChange(false);
        setFormData({
          model: "gpt-4o-mini",
          general_prompt: DEFAULT_PROMPT,
          start_speaker: "agent",
          begin_message:
            "Hello, this is the AI assistant calling on behalf of the project manager. Am I speaking with the person responsible for the subcontracted work?",
        });
      } else {
        toast.error(data.error || "Error creating LLM");
      }
    } catch (error) {
      console.error("Error creating LLM:", error);
      toast.error("Error creating LLM");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New LLM</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={formData.model}
              onValueChange={(value) =>
                setFormData({ ...formData, model: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">
                  GPT-4o Mini (Recommended)
                </SelectItem>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                <SelectItem value="claude-3.7-sonnet">
                  Claude 3.7 Sonnet
                </SelectItem>
                <SelectItem value="claude-3.5-haiku">
                  Claude 3.5 Haiku
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="general_prompt">General Prompt *</Label>
            <Textarea
              id="general_prompt"
              value={formData.general_prompt}
              onChange={(e) =>
                setFormData({ ...formData, general_prompt: e.target.value })
              }
              placeholder="Describe the agent's behavior and personality..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Define how the agent should behave and what tasks it should
              perform
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_speaker">Who starts the conversation?</Label>
            <Select
              value={formData.start_speaker}
              onValueChange={(value) =>
                setFormData({ ...formData, start_speaker: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">
                  Agent (Agent speaks first)
                </SelectItem>
                <SelectItem value="user">User (User speaks first)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.start_speaker === "agent" && (
            <div className="space-y-2">
              <Label htmlFor="begin_message">Initial Message</Label>
              <Input
                id="begin_message"
                value={formData.begin_message}
                onChange={(e) =>
                  setFormData({ ...formData, begin_message: e.target.value })
                }
                placeholder="Hello, how can I help you?"
              />
              <p className="text-xs text-muted-foreground">
                First phrase the agent will say when starting the call
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create LLM"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

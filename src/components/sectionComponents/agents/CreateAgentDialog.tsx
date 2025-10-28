'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAgent } from '@/lib/hooks/use-agents';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAgentDialog({ open, onOpenChange, onSuccess }: CreateAgentDialogProps) {
  const createAgent = useCreateAgent();
  const [formData, setFormData] = useState({
    agent_name: '',
    voice_id: '11labs-Adrian',
    language: 'es-ES',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agent_name) {
      return;
    }

    try {
      await createAgent.mutateAsync({
        agent_name: formData.agent_name,
        voice_id: formData.voice_id,
        voice_model: 'eleven_multilingual_v2',
        language: formData.language,
        auto_create_llm: true,
      });
      
      setFormData({
        agent_name: '',
        voice_id: '11labs-Adrian',
        language: 'es-ES',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_name">Agent Name *</Label>
            <Input
              id="agent_name"
              value={formData.agent_name}
              onChange={(e) => handleChange('agent_name', e.target.value)}
              placeholder="e.g., Construction Assistant"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice_id">Voice</Label>
            <Select
              value={formData.voice_id}
              onValueChange={(value) => handleChange('voice_id', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="11labs-Adrian">11labs - Adrian</SelectItem>
                <SelectItem value="11labs-Matilda">11labs - Matilda</SelectItem>
                <SelectItem value="openai-Alloy">OpenAI - Alloy</SelectItem>
                <SelectItem value="openai-Echo">OpenAI - Echo</SelectItem>
                <SelectItem value="deepgram-Angus">Deepgram - Angus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => handleChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                <SelectItem value="es-419">Spanish (Latin America)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createAgent.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createAgent.isPending}>
              {createAgent.isPending ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

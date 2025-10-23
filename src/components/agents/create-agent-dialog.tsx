'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAgentDialog({ open, onOpenChange, onSuccess }: CreateAgentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agent_name: '',
    voice_id: '11labs-Adrian',
    language: 'es-ES',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agent_name) {
      toast.error('Please enter an agent name');
      return;
    }

    setLoading(true);

    try {
      // Enviar con configuración automática
      const payload = {
        agent_name: formData.agent_name,
        voice_id: formData.voice_id,
        voice_model: 'eleven_multilingual_v2', // Siempre multilingual
        language: formData.language,
        auto_create_llm: true, // Flag para crear LLM automáticamente si no existe
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Agent created successfully');
        onSuccess();
        onOpenChange(false);
        setFormData({
          agent_name: '',
          voice_id: '11labs-Adrian',
          language: 'es-ES',
        });
      } else {
        toast.error(data.error || 'Error creating agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Error creating agent');
    } finally {
      setLoading(false);
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
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              placeholder="e.g., Construction Assistant"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice_id">Voice</Label>
            <Select
              value={formData.voice_id}
              onValueChange={(value) => setFormData({ ...formData, voice_id: value })}
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
              onValueChange={(value) => setFormData({ ...formData, language: value })}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

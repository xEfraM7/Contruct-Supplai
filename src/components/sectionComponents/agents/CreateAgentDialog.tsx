'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAgentDialog } from '@/hooks/useCreateAgentDialog';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAgentDialog({ open, onOpenChange, onSuccess }: CreateAgentDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const { loading, formData, handleSubmit, handleChange } = useCreateAgentDialog(handleSuccess);

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

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Trash2, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AgentCardProps {
  agent: {
    id: string;
    agent_id: string;
    agent_name: string;
    voice_id: string;
    language: string;
    is_active: boolean;
    created_at: string;
  };
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function AgentCard({ agent, onDelete, onToggleActive }: AgentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{agent.agent_name || 'Unnamed'}</h3>
            <p className="text-sm text-muted-foreground">ID: {agent.agent_id.slice(0, 8)}...</p>
          </div>
        </div>
        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
          {agent.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Voice:</span>
          <span className="font-medium">{agent.voice_id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Language:</span>
          <span className="font-medium">{agent.language}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created:</span>
          <span className="font-medium">{formatDate(agent.created_at)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onToggleActive(agent.id, agent.is_active)}
        >
          {agent.is_active ? (
            <>
              <PowerOff className="w-4 h-4 mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2" />
              Activate
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(agent.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

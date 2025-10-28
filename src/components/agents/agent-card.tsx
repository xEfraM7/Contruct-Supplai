import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Trash2, Power, PowerOff, Globe } from 'lucide-react';
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                {agent.agent_name || 'Unnamed Agent'}
              </CardTitle>
            </div>
          </div>
          <Badge variant={agent.is_active ? 'default' : 'secondary'}>
            {agent.is_active ? 'active' : 'inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>{agent.language}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span className="truncate">Voice: {agent.voice_id}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
          <span className="text-xs">Created {formatDate(agent.created_at)}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(agent.id, agent.is_active);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

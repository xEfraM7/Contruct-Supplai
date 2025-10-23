'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Phone } from 'lucide-react';
import { CreateAgentDialog } from '@/components/agents/create-agent-dialog';
import { AgentCard } from '@/components/agents/agent-card';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/use-confirm';

interface Agent {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  voice_model: string;
  language: string;
  llm_id: string;
  is_active: boolean;
  created_at: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      
      if (response.ok) {
        setAgents(data.agents || []);
      } else {
        toast.error('Error loading agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Error loading agents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Agent',
      description: 'Are you sure you want to delete this agent? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Agent deleted successfully');
        fetchAgents();
      } else {
        toast.error('Error deleting agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Error deleting agent');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        toast.success(`Agent ${!isActive ? 'activated' : 'deactivated'}`);
        fetchAgents();
      } else {
        toast.error('Error updating agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Error updating agent');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your voice agents with Retell AI
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No agents created</h3>
          <p className="text-muted-foreground mb-4">
            Create your first AI agent to get started
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={handleDeleteAgent}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchAgents}
      />
      <ConfirmDialog />
    </div>
  );
}

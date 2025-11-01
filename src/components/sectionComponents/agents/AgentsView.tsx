import { Button } from "@/components/ui/button";
import { Plus, Phone, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCard } from "./AgentCard";
import { CreateAgentDialog } from "./CreateAgentDialog";
import { AgentsViewProps } from "./types/agent-types";

export function AgentsView({
  agents,
  isLoading,
  isCreateDialogOpen,
  onOpenCreateDialog,
  onDeleteAgent,
  onToggleActive,
  onCreateSuccess,
}: AgentsViewProps) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            AI Agents
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your voice agents with Retell AI
          </p>
        </div>
        {agents.length > 0 && (
          <Button
            onClick={() => onOpenCreateDialog(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No agents yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first AI agent to get started
            </p>
            <Button onClick={() => onOpenCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={onDeleteAgent}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={onOpenCreateDialog}
        onSuccess={onCreateSuccess}
      />
    </section>
  );
}

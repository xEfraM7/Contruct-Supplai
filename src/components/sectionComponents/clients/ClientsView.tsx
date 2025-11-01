import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, Phone, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateClientModal } from "./CreateClientModal";
import { ClientsViewProps } from "./types/client-types";

export function ClientsView({
  clients,
  isLoading,
  isCreateModalOpen,
  onClientClick,
  onAddClient,
  onOpenCreateModal,
  onCreateSuccess,
}: ClientsViewProps) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Clients
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your client companies and their contacts
          </p>
        </div>
        {clients.length > 0 && (
          <Button
            onClick={onAddClient}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No clients yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first client company
            </p>
            <Button onClick={onAddClient}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onClientClick(client.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {client.company_name}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge
                    variant={
                      client.status === "active" ? "default" : "secondary"
                    }
                  >
                    {client.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.company_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{client.company_email}</span>
                  </div>
                )}
                {client.company_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{client.company_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClientModal
        open={isCreateModalOpen}
        onOpenChange={onOpenCreateModal}
        onSuccess={onCreateSuccess}
      />
    </section>
  );
}

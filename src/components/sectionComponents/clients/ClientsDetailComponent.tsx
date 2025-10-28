"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Plus,
  Loader2,
  User,
  MoreVertical,
  Edit,
  Trash2,
  PhoneCall,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCallDialog } from "@/components/calls/CreateCallDialog";
import { CallHistoryDialog } from "@/components/calls/CallHistoryDialog";
import { useClient, useDeleteClient } from "@/lib/hooks/use-clients";
import { themeColors } from "@/lib/theme";

interface Client {
  id: string;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  status: string;
  subcontractors: Subcontractor[];
}

interface Subcontractor {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  status: string;
  created_at: string;
}

export function ClientDetailComponent() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const { data: client, isLoading } = useClient(clientId);
  const deleteClient = useDeleteClient();

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContactForCall, setSelectedContactForCall] =
    useState<Subcontractor | null>(null);
  const [selectedContactForHistory, setSelectedContactForHistory] =
    useState<Subcontractor | null>(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
  });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/subcontractors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      const result = await response.json();

      if (result.success) {
        setIsAddContactOpen(false);
        setContactForm({ name: "", phone: "", email: "", company: "" });
        // Client data will be refetched automatically by React Query
      } else {
        alert(result.error || "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      await deleteClient.mutateAsync(clientId);
      router.push("/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Client not found</p>
        <Button onClick={() => router.push("/clients")} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/clients")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Client Info Card */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {client.company_name}
                </CardTitle>
                <Badge
                  variant={client.status === "active" ? "default" : "secondary"}
                  className="mt-2"
                >
                  {client.status}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteClient}
                  className={themeColors.interactive.delete.text}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {client.company_email && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-5 h-5" />
              <span>{client.company_email}</span>
            </div>
          )}
          {client.company_phone && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="w-5 h-5" />
              <span>{client.company_phone}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5" />
              <span>{client.address}</span>
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Globe className="w-5 h-5" />
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                {client.website}
              </a>
            </div>
          )}
          {client?.notes && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <Button onClick={() => setIsAddContactOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(client?.subcontractors?.length || 0) === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No contacts yet</p>
              <Button onClick={() => setIsAddContactOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add First Contact
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {client?.subcontractors?.map((contact: Subcontractor) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {contact.name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                      {contact.company && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedContactForHistory(contact)}
                    >
                      <History className="w-4 h-4 mr-1" />
                      History
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSelectedContactForCall(contact)}
                    >
                      <PhoneCall className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Badge
                      variant={
                        contact.status === "active" ? "default" : "secondary"
                      }
                    >
                      {contact.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className={themeColors.status.error.text}>*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className={themeColors.status.error.text}>*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({ ...contactForm, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className={themeColors.status.error.text}>*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                Position/Role <span className={themeColors.status.error.text}>*</span>
              </Label>
              <Input
                id="company"
                placeholder="Project Manager"
                value={contactForm.company}
                onChange={(e) =>
                  setContactForm({ ...contactForm, company: e.target.value })
                }
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddContactOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Contact"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Call Dialog */}
      {selectedContactForCall && (
        <CreateCallDialog
          open={!!selectedContactForCall}
          onOpenChange={(open) => !open && setSelectedContactForCall(null)}
          subcontractorId={selectedContactForCall.id}
          subcontractorName={selectedContactForCall.name}
          subcontractorPhone={selectedContactForCall.phone}
          onCallCreated={() => {
            setSelectedContactForCall(null);
          }}
        />
      )}

      {/* Call History Dialog */}
      {selectedContactForHistory && (
        <CallHistoryDialog
          open={!!selectedContactForHistory}
          onOpenChange={(open) => !open && setSelectedContactForHistory(null)}
          subcontractorId={selectedContactForHistory.id}
          subcontractorName={selectedContactForHistory.name}
        />
      )}
    </section>
  );
}

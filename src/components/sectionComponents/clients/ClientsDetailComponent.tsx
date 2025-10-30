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
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  User,
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
import { useClient, useDeleteClient } from "@/lib/hooks/use-clients";
import { useContacts, useCreateContact, useDeleteContact } from "@/lib/hooks/use-contacts";
import { CreateCallDialog } from "@/components/calls/CreateCallDialog";
import { CallHistoryDialog } from "@/components/calls/CallHistoryDialog";
import { themeColors } from "@/lib/theme";
import type { Contact } from "@/types/contact";

export function ClientDetailComponent() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const { data: client, isLoading } = useClient(clientId);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(clientId);
  const deleteClient = useDeleteClient();
  const createContact = useCreateContact(clientId);
  const deleteContact = useDeleteContact(clientId);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
  });
  const [selectedContactForCall, setSelectedContactForCall] = useState<Contact | null>(null);
  const [selectedContactForHistory, setSelectedContactForHistory] = useState<Contact | null>(null);

  const handleAddContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      alert("Name and phone are required");
      return;
    }

    try {
      await createContact.mutateAsync(contactForm);
      setIsAddContactOpen(false);
      setContactForm({ name: "", phone: "", email: "", position: "" });
    } catch (error) {
      console.error("Error creating contact:", error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteContact.mutateAsync(contactId);
    } catch (error) {
      console.error("Error deleting contact:", error);
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
          {contactsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
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
              {contacts.map((contact) => (
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
                      {contact.position && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.position}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedContactForCall(contact)}
                    >
                      <PhoneCall className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedContactForHistory(contact)}
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteContact(contact.id)}
                          className={themeColors.interactive.delete.text}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="John Doe"
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                placeholder="+1234567890"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({ ...contactForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Position / Role</Label>
              <Input
                placeholder="e.g. Project Manager, CEO, Contractor"
                value={contactForm.position}
                onChange={(e) =>
                  setContactForm({ ...contactForm, position: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddContactOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddContact}
                disabled={createContact.isPending}
              >
                {createContact.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Contact"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Call Dialog */}
      {selectedContactForCall && (
        <CreateCallDialog
          open={!!selectedContactForCall}
          onOpenChange={(open) => !open && setSelectedContactForCall(null)}
          contactId={selectedContactForCall.id}
          contactName={selectedContactForCall.name}
          contactPhone={selectedContactForCall.phone}
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
          contactId={selectedContactForHistory.id}
          contactName={selectedContactForHistory.name}
        />
      )}
    </section>
  );
}

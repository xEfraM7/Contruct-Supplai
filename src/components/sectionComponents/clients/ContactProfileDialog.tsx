'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@/lib/validations/contact';
import { useUpdateContact } from '@/lib/hooks/use-contacts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormInput, FormSelect } from '@/components/form';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Briefcase, Clock, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import type { Contact } from '@/types/contact';
import { ContactTasksList } from './ContactTasksList';

interface ContactProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  clientId: string;
}

const roleLabels: Record<string, string> = {
  project_manager: 'Project Manager',
  estimator: 'Estimator',
  field_worker: 'Field Worker',
  supervisor: 'Supervisor',
  foreman: 'Foreman',
  engineer: 'Engineer',
  contractor: 'Contractor',
  other: 'Other',
};

export function ContactProfileDialog({
  open,
  onOpenChange,
  contact,
  clientId,
}: ContactProfileDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const updateContact = useUpdateContact(clientId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      role: contact.role || undefined,
      hourly_rate: contact.hourly_rate || undefined,
      hire_date: contact.hire_date || '',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      await updateContact.mutateAsync({
        contactId: contact.id,
        data: {
          ...data,
          skills: contact.skills || [],
        },
      });
      toast.success('Contact updated successfully');
    } catch (error) {
      toast.error('Failed to update contact');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>{contact.name}</DialogTitle>
              {contact.role && (
                <Badge variant="outline" className="mt-1">
                  {roleLabels[contact.role]}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="details">
              <Briefcase className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodo className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Full Name"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="John Doe"
                />
                <FormInput
                  label="Phone"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <FormInput
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="john@example.com"
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateContact.isPending}>
                  {updateContact.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Role"
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    error={errors.role?.message}
                    placeholder="Select a role"
                    options={[
                      { value: 'project_manager', label: 'Project Manager' },
                      { value: 'estimator', label: 'Estimator' },
                      { value: 'field_worker', label: 'Field Worker' },
                      { value: 'supervisor', label: 'Supervisor' },
                      { value: 'foreman', label: 'Foreman' },
                      { value: 'engineer', label: 'Engineer' },
                      { value: 'contractor', label: 'Contractor' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Hourly Rate"
                  type="number"
                  step="0.01"
                  {...register('hourly_rate', { valueAsNumber: true })}
                  error={errors.hourly_rate?.message}
                  placeholder="35.00"
                />
                <FormInput
                  label="Hire Date"
                  type="date"
                  {...register('hire_date')}
                  error={errors.hire_date?.message}
                />
              </div>

              {contact.hourly_rate && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Current Rate:</span>
                    <span className="font-semibold">${contact.hourly_rate}/hr</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateContact.isPending}>
                  {updateContact.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="tasks">
            <ContactTasksList contactId={contact.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import type { Contact } from '@/types/contact';

// Fetch all contacts that can be project managers (any contact with a role)
export function useProjectManagers() {
  return useQuery<Contact[]>({
    queryKey: ['project-managers'],
    queryFn: async () => {
      const response = await fetch('/api/project-managers');
      if (!response.ok) throw new Error('Failed to fetch project managers');
      return response.json();
    },
  });
}

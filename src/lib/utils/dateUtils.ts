export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isOverdue(dateString: string): boolean {
  return getDaysUntil(dateString) < 0;
}

export function getDateStatus(dateString: string): { 
  status: 'upcoming' | 'due-soon' | 'overdue'; 
  message: string;
  color: string;
} {
  const days = getDaysUntil(dateString);
  
  if (days < 0) {
    return {
      status: 'overdue',
      message: `${Math.abs(days)} days overdue`,
      color: 'text-red-600'
    };
  } else if (days <= 7) {
    return {
      status: 'due-soon',
      message: days === 0 ? 'Due today' : `${days} days left`,
      color: 'text-yellow-600'
    };
  } else {
    return {
      status: 'upcoming',
      message: `${days} days left`,
      color: 'text-green-600'
    };
  }
}
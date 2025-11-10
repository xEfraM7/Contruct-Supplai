import { useQuery } from "@tanstack/react-query";

export interface AnalyticsData {
  projects: {
    total: number;
    active: number;
    completed: number;
    overBudget: number;
    avgCompletion: number;
  };
  budget: {
    total: number;
    actualCost: number;
    variance: number;
    utilizationRate: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  timeline: {
    onTimeRate: number;
    projectsWithDates: number;
    onTimeProjects: number;
  };
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();
      return data.analytics as AnalyticsData;
    },
  });
}

export interface ProjectProgress {
  id: string;
  name: string;
  client: string;
  status: string;
  actualProgress: number;
  expectedProgress: number;
  progressVariance: number;
  isOnTrack: boolean;
  estimatedBudget: number;
  actualCost: number;
}

export function useProjectProgress() {
  return useQuery({
    queryKey: ["analytics", "project-progress"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/project-progress");
      if (!response.ok) {
        throw new Error("Failed to fetch project progress");
      }
      const data = await response.json();
      return data.projects as ProjectProgress[];
    },
  });
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  estimatedHours: number;
  actualHours: number;
  overdueTasks: number;
  completionRate: number;
  efficiency: number;
  totalCost: number;
}

export interface TeamProductivityData {
  teamMetrics: TeamMember[];
  summary: {
    totalMembers: number;
    totalHours: number;
    totalCost: number;
    avgCompletionRate: number;
  };
}

export function useTeamProductivity() {
  return useQuery({
    queryKey: ["analytics", "team-productivity"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/team-productivity");
      if (!response.ok) {
        throw new Error("Failed to fetch team productivity");
      }
      const data = await response.json();
      return data as TeamProductivityData;
    },
  });
}

export interface Risk {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  value?: number;
}

export interface RisksData {
  risks: Risk[];
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export function useRisks() {
  return useQuery({
    queryKey: ["analytics", "risks"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/risks");
      if (!response.ok) {
        throw new Error("Failed to fetch risks");
      }
      const data = await response.json();
      return data as RisksData;
    },
  });
}

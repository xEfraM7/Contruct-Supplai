/**
 * Centralized color configuration for the application
 * Uses shadcn/ui color system with Tailwind CSS
 *
 * This file provides semantic color tokens that map to Tailwind classes.
 * All colors are theme-aware and work with both light and dark modes.
 */

import { cn } from "@/lib/utils";

/**
 * Semantic color configurations for different contexts
 * These use Tailwind's color palette which is already theme-aware
 */
export const themeColors = {
  // Status colors - using chart colors from shadcn theme
  status: {
    success: {
      bg: "bg-chart-2/10",
      text: "text-chart-2",
      border: "border-chart-2/20",
      badge: "bg-chart-2/10 text-chart-4 border-chart-4/20",
      icon: "text-chart-2",
      solid: "bg-chart-2",
    },
    error: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/20",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
      icon: "text-destructive",
      solid: "bg-destructive",
    },
    warning: {
      bg: "bg-chart-5/10",
      text: "text-chart-5",
      border: "border-chart-5/20",
      badge: "bg-chart-5/10 text-chart-5 border-chart-5/20",
      icon: "text-chart-5",
      solid: "bg-chart-5",
    },
    info: {
      bg: "bg-chart-4/10",
      text: "text-chart-4",
      border: "border-chart-4/20",
      badge: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      icon: "text-chart-4",
      solid: "bg-chart-4",
    },
  },

  // Event type colors (for schedule) - using chart colors
  eventTypes: {
    meeting: {
      solid: "bg-chart-2",
      icon: "text-chart-2",
      label: "Meeting",
    },
    inspection: {
      solid: "bg-chart-4",
      icon: "text-chart-4",
      label: "Inspection",
    },
    delivery: {
      solid: "bg-chart-5",
      icon: "text-chart-5",
      label: "Delivery",
    },
    milestone: {
      solid: "bg-chart-1",
      icon: "text-chart-1",
      label: "Milestone",
    },
    maintenance: {
      solid: "bg-chart-3",
      icon: "text-chart-3",
      label: "Maintenance",
    },
    safety: {
      solid: "bg-destructive",
      icon: "text-destructive",
      label: "Safety",
    },
  },

  // Priority colors
  priority: {
    low: {
      solid: "bg-muted-foreground",
      text: "text-muted-foreground",
      label: "Low",
    },
    medium: {
      solid: "bg-chart-2",
      text: "text-chart-2",
      label: "Medium",
    },
    high: {
      solid: "bg-chart-5",
      text: "text-chart-5",
      label: "High",
    },
    critical: {
      solid: "bg-destructive",
      text: "text-destructive",
      label: "Critical",
    },
  },

  // Schedule status colors
  scheduleStatus: {
    scheduled: {
      solid: "bg-chart-2",
      text: "text-chart-2",
      label: "Scheduled",
    },
    "in-progress": {
      solid: "bg-chart-3",
      text: "text-chart-3",
      label: "In Progress",
    },
    completed: {
      solid: "bg-chart-4",
      text: "text-chart-4",
      label: "Completed",
    },
    cancelled: {
      solid: "bg-muted-foreground",
      text: "text-muted-foreground",
      label: "Cancelled",
    },
  },

  // Equipment status colors
  equipmentStatus: {
    available: {
      badge:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
      label: "Available",
    },
    checked_out: {
      badge: "bg-chart-5/10 text-chart-5 border-chart-5/20",
      label: "Checked Out",
    },
    maintenance: {
      badge: "bg-chart-3/10 text-chart-3 border-chart-3/20",
      label: "Maintenance",
    },
    retired: {
      badge: "bg-muted text-muted-foreground border-border",
      label: "Retired",
    },
  },

  // Confidence/Progress colors
  confidence: {
    high: "bg-chart-4",
    medium: "bg-chart-5",
    low: "bg-destructive",
  },

  // Interactive elements
  interactive: {
    delete: {
      text: "text-destructive",
      hover: "hover:text-destructive hover:bg-destructive/10",
      button:
        "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },
  },

  // Sidebar navigation colors
  sidebar: {
    navActive: "bg-gray-200 dark:bg-sidebar-accent",
    navHover: "hover:bg-sidebar-accent/80",
  },

  // Card backgrounds for different contexts
  cards: {
    budget: {
      bg: "bg-chart-2/10",
      border: "border-chart-2/20",
      title: "text-chart-2",
      text: "text-chart-2/80",
    },
    inventory: {
      bg: "bg-chart-4/10",
      border: "border-chart-4/20",
      title: "text-chart-4",
      text: "text-chart-4/80",
    },
    needed: {
      bg: "bg-chart-5/10",
      border: "border-chart-5/20",
      title: "text-chart-5",
      text: "text-chart-5/80",
    },
    alert: {
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      title: "text-destructive",
      text: "text-destructive/80",
      icon: "text-destructive",
    },
  },
} as const;

// Helper functions to get color classes
export function getStatusColors(
  type: "success" | "error" | "warning" | "info"
) {
  return themeColors.status[type];
}

export function getEventTypeColor(type: keyof typeof themeColors.eventTypes) {
  return themeColors.eventTypes[type];
}

export function getPriorityColor(priority: keyof typeof themeColors.priority) {
  return themeColors.priority[priority];
}

export function getScheduleStatusColor(
  status: keyof typeof themeColors.scheduleStatus
) {
  return themeColors.scheduleStatus[status];
}

export function getEquipmentStatusColor(
  status: keyof typeof themeColors.equipmentStatus
) {
  return themeColors.equipmentStatus[status];
}

// Utility to combine color classes
export function combineColors(...classes: string[]) {
  return cn(...classes);
}

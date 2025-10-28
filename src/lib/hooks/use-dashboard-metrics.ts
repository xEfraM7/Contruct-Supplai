import { useQuery } from "@tanstack/react-query";

interface DashboardMetrics {
  activeContracts: number;
  totalBudget: number;
  onTimeDelivery: number;
}

// Fetch dashboard metrics
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard metrics");
      }
      const data = await response.json();
      return data as DashboardMetrics;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

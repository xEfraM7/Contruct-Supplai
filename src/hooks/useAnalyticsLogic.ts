"use client";

// Analytics es principalmente estático, pero podemos preparar la estructura
export function useAnalyticsLogic() {
  const revenueData = [
    { month: "Jan", revenue: 45000, spending: 32000 },
    { month: "Feb", revenue: 52000, spending: 38000 },
    { month: "Mar", revenue: 48000, spending: 35000 },
    { month: "Apr", revenue: 61000, spending: 42000 },
    { month: "May", revenue: 55000, spending: 39000 },
    { month: "Jun", revenue: 67000, spending: 45000 },
  ];

  const summaryMetrics = [
    { label: "Total Budget", value: "$5.2M", change: "+12%", trend: "up" as const },
    { label: "Total Revenue", value: "$3.8M", change: "+18%", trend: "up" as const },
    { label: "Total Spending", value: "$2.1M", change: "-5%", trend: "down" as const },
  ];

  return {
    revenueData,
    summaryMetrics,
  };
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, FolderKanban, DollarSign, CheckCircle2, Target } from "lucide-react"
import { useAnalytics } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"

export function AnalyticsSummary() {
  const { data: analytics, isLoading } = useAnalytics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  const metrics = [
    {
      label: "Active Projects",
      value: analytics.projects.active,
      total: analytics.projects.total,
      subtitle: `${analytics.projects.avgCompletion}% avg completion`,
      icon: FolderKanban,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      label: "Budget Status",
      value: `$${(analytics.budget.actualCost / 1000).toFixed(1)}K`,
      total: `$${(analytics.budget.total / 1000).toFixed(1)}K`,
      subtitle: `${analytics.budget.utilizationRate.toFixed(1)}% utilized`,
      icon: DollarSign,
      color: analytics.budget.variance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: analytics.budget.variance >= 0 ? "bg-green-100 dark:bg-green-950" : "bg-red-100 dark:bg-red-950",
      trend: analytics.budget.variance >= 0 ? "up" : "down",
    },
    {
      label: "Task Completion",
      value: `${analytics.tasks.completionRate.toFixed(0)}%`,
      total: `${analytics.tasks.completed}/${analytics.tasks.total}`,
      subtitle: analytics.tasks.overdue > 0 ? `${analytics.tasks.overdue} overdue` : "All on track",
      icon: CheckCircle2,
      color: analytics.tasks.overdue > 0 ? "text-yellow-600" : "text-green-600",
      bgColor: analytics.tasks.overdue > 0 ? "bg-yellow-100 dark:bg-yellow-950" : "bg-green-100 dark:bg-green-950",
    },
    {
      label: "On-Time Delivery",
      value: `${analytics.timeline.onTimeRate}%`,
      total: `${analytics.timeline.onTimeProjects}/${analytics.timeline.projectsWithDates}`,
      subtitle: "projects completed on time",
      icon: Target,
      color: analytics.timeline.onTimeRate >= 80 ? "text-green-600" : "text-yellow-600",
      bgColor: analytics.timeline.onTimeRate >= 80 ? "bg-green-100 dark:bg-green-950" : "bg-yellow-100 dark:bg-yellow-950",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-card-foreground">{metric.value}</p>
                  {metric.total && (
                    <span className="text-sm text-muted-foreground">/ {metric.total}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {metric.trend === "up" && (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  )}
                  {metric.trend === "down" && (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className="text-xs text-muted-foreground">{metric.subtitle}</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center flex-shrink-0`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

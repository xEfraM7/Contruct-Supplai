"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useProjectProgress } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"

export function BudgetTrackingChart() {
  const { data: projects, isLoading } = useProjectProgress()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No project data available
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for chart - only show projects with budget
  const chartData = projects
    .filter(p => p.estimatedBudget > 0)
    .slice(0, 10) // Show top 10 projects
    .map(project => ({
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      estimated: project.estimatedBudget,
      actual: project.actualCost,
      variance: project.estimatedBudget - project.actualCost,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Tracking: Estimated vs Actual</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparison of estimated budget and actual costs across projects
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 250)" />
            <XAxis 
              dataKey="name" 
              stroke="oklch(0.60 0 0)" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="oklch(0.60 0 0)"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.14 0.01 250)",
                border: "1px solid oklch(0.22 0.02 250)",
                borderRadius: "8px",
                color: "oklch(0.92 0 0)",
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <Bar 
              dataKey="estimated" 
              fill="oklch(0.55 0.20 280)" 
              radius={[4, 4, 0, 0]}
              name="Estimated Budget"
            />
            <Bar 
              dataKey="actual" 
              fill="oklch(0.60 0.15 200)" 
              radius={[4, 4, 0, 0]}
              name="Actual Cost"
            />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Estimated</p>
            <p className="text-lg font-semibold">
              ${chartData.reduce((sum, p) => sum + p.estimated, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Actual</p>
            <p className="text-lg font-semibold">
              ${chartData.reduce((sum, p) => sum + p.actual, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Variance</p>
            <p className={`text-lg font-semibold ${
              chartData.reduce((sum, p) => sum + p.variance, 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              ${Math.abs(chartData.reduce((sum, p) => sum + p.variance, 0)).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

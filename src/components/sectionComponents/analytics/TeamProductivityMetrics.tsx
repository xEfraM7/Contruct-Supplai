"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useTeamProductivity } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Clock, DollarSign } from "lucide-react"

export function TeamProductivityMetrics() {
  const { data, isLoading } = useTeamProductivity()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.teamMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No team data available
          </p>
        </CardContent>
      </Card>
    )
  }

  const { teamMetrics, summary } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Productivity Metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Task completion and efficiency by team member
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Members</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalMembers}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Hours</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalHours}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Cost</span>
            </div>
            <p className="text-2xl font-bold">${(summary.totalCost / 1000).toFixed(1)}K</p>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
          {teamMetrics.slice(0, 8).map((member) => (
            <div key={member.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{member.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {member.completedTasks}/{member.totalTasks} tasks
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={member.completionRate} className="h-2" />
                <div className="flex justify-between text-xs">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">
                      {member.actualHours}h worked
                    </span>
                    {member.overdueTasks > 0 && (
                      <Badge variant="outline" className="text-red-600 border-red-600 h-4 px-1 text-[10px]">
                        {member.overdueTasks} overdue
                      </Badge>
                    )}
                  </div>
                  {member.efficiency > 0 && (
                    <span className={`${
                      member.efficiency <= 100 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`}>
                      {member.efficiency}% efficiency
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

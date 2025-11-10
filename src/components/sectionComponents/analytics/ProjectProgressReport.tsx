"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useProjectProgress } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function ProjectProgressReport() {
  const { data: projects, isLoading } = useProjectProgress()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
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

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No projects available
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show only active projects, sorted by progress variance
  const activeProjects = projects
    .filter(p => p.status === 'active')
    .sort((a, b) => a.progressVariance - b.progressVariance)
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress Reports</CardTitle>
        <p className="text-sm text-muted-foreground">
          Actual vs expected progress for active projects
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {activeProjects.map((project) => (
            <div key={project.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    {project.isOnTrack ? (
                      <Badge variant="outline" className="text-green-600 border-green-600 flex-shrink-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        On Track
                      </Badge>
                    ) : project.progressVariance < -20 ? (
                      <Badge variant="outline" className="text-red-600 border-red-600 flex-shrink-0">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Behind
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600 flex-shrink-0">
                        <Minus className="w-3 h-3 mr-1" />
                        At Risk
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{project.client}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{project.actualProgress}%</p>
                  <p className="text-xs text-muted-foreground">
                    Expected: {project.expectedProgress}%
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={project.actualProgress} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className={`${
                    project.progressVariance >= 0 
                      ? 'text-green-600' 
                      : project.progressVariance < -20 
                      ? 'text-red-600' 
                      : 'text-yellow-600'
                  }`}>
                    {project.progressVariance > 0 ? '+' : ''}{project.progressVariance}% variance
                  </span>
                  <span className="text-muted-foreground">
                    ${(project.actualCost / 1000).toFixed(1)}K / ${(project.estimatedBudget / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

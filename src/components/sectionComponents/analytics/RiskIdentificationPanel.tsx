"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRisks } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, AlertCircle, Info, XCircle, DollarSign, Clock, ListTodo, TrendingDown } from "lucide-react"

const severityConfig = {
  critical: {
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-600",
    icon: XCircle,
    label: "Critical",
  },
  high: {
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    borderColor: "border-orange-600",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-950",
    borderColor: "border-yellow-600",
    icon: AlertCircle,
    label: "Medium",
  },
  low: {
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-600",
    icon: Info,
    label: "Low",
  },
}

const riskTypeIcons = {
  budget_overrun: DollarSign,
  overdue_project: Clock,
  overdue_tasks: ListTodo,
  at_risk: TrendingDown,
}

export function RiskIdentificationPanel() {
  const { data, isLoading } = useRisks()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.risks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-card-foreground">No Risks Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              All projects are on track with no identified risks
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { risks, counts } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Identification</CardTitle>
        <p className="text-sm text-muted-foreground">
          Identified risks across projects: budget overruns, delays, and at-risk items
        </p>
      </CardHeader>
      <CardContent>
        {/* Risk Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6 pb-4 border-b">
          {Object.entries(counts).filter(([key]) => key !== 'total').map(([severity, count]) => {
            const config = severityConfig[severity as keyof typeof severityConfig]
            const Icon = config.icon
            return (
              <div key={severity} className="text-center">
                <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{config.label}</p>
              </div>
            )
          })}
        </div>

        {/* Risk List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {risks.map((risk) => {
            const config = severityConfig[risk.severity]
            const SeverityIcon = config.icon
            const TypeIcon = riskTypeIcons[risk.type as keyof typeof riskTypeIcons] || AlertCircle

            return (
              <div
                key={risk.id}
                className={`p-4 rounded-lg border-l-4 ${config.borderColor} bg-card hover:bg-accent/50 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{risk.title}</h4>
                      <Badge variant="outline" className={`${config.color} ${config.borderColor} flex-shrink-0`}>
                        <SeverityIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                    {risk.projectName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Project: {risk.projectName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {risks.length > 10 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Showing {Math.min(10, risks.length)} of {risks.length} risks
          </p>
        )}
      </CardContent>
    </Card>
  )
}

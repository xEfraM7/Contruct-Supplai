"use client"

import { AnalyticsSummary } from "./AnalyticsSummary"
import { BudgetTrackingChart } from "./BudgetTrackingChart"
import { ProjectProgressReport } from "./ProjectProgressReport"
import { TeamProductivityMetrics } from "./TeamProductivityMetrics"
import { RiskIdentificationPanel } from "./RiskIdentificationPanel"

export function AnalyticsComponent() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Reporting & Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive project insights and performance metrics
        </p>
      </div>

      {/* Summary Metrics */}
      <AnalyticsSummary />

      {/* Budget Tracking */}
      <BudgetTrackingChart />

      {/* Project Progress & Team Productivity */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProjectProgressReport />
        <TeamProductivityMetrics />
      </div>

      {/* Risk Identification */}
      <RiskIdentificationPanel />
    </section>
  )
}

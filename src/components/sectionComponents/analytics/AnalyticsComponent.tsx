"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { themeColors } from "@/lib/theme"

const revenueData = [
  { month: "Jan", revenue: 45000, spending: 32000 },
  { month: "Feb", revenue: 52000, spending: 38000 },
  { month: "Mar", revenue: 48000, spending: 35000 },
  { month: "Apr", revenue: 61000, spending: 42000 },
  { month: "May", revenue: 55000, spending: 39000 },
  { month: "Jun", revenue: 67000, spending: 45000 },
]

const summaryMetrics = [
  { label: "Total Budget", value: "$5.2M", change: "+12%", trend: "up", icon: Wallet },
  { label: "Total Revenue", value: "$3.8M", change: "+18%", trend: "up", icon: DollarSign },
  { label: "Total Spending", value: "$2.1M", change: "-5%", trend: "down", icon: CreditCard },
]

export function AnalyticsComponent() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-6">Analytics</h2>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {summaryMetrics.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-card-foreground">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metric.trend === "up" ? (
                      <TrendingUp className={`w-4 h-4 ${themeColors.status.success.icon}`} />
                    ) : (
                      <TrendingDown className={`w-4 h-4 ${themeColors.status.error.icon}`} />
                    )}
                    <span className={`text-sm ${metric.trend === "up" ? themeColors.status.success.text : themeColors.status.error.text}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 250)" />
                <XAxis dataKey="month" stroke="oklch(0.60 0 0)" />
                <YAxis stroke="oklch(0.60 0 0)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.14 0.01 250)",
                    border: "1px solid oklch(0.22 0.02 250)",
                    borderRadius: "8px",
                    color: "oklch(0.92 0 0)",
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="oklch(0.55 0.20 280)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Revenue vs Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 250)" />
                <XAxis dataKey="month" stroke="oklch(0.60 0 0)" />
                <YAxis stroke="oklch(0.60 0 0)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.14 0.01 250)",
                    border: "1px solid oklch(0.22 0.02 250)",
                    borderRadius: "8px",
                    color: "oklch(0.92 0 0)",
                  }}
                />
                <Bar dataKey="revenue" fill="oklch(0.55 0.20 280)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spending" fill="oklch(0.60 0.15 200)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, DollarSign, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const kpis = [
  { label: "Active Contracts", value: "24", icon: FileText, change: "+12%" },
  { label: "Total Revenue", value: "$2.4M", icon: DollarSign, change: "+8%" },
  { label: "Pending RFIs", value: "7", icon: MessageSquare, change: "-3%" },
]

const recentProjects = [
  { name: "Downtown Office Complex", client: "Acme Corp", status: "In Progress", progress: 65 },
  { name: "Residential Tower A", client: "BuildRight LLC", status: "Planning", progress: 20 },
  { name: "Shopping Mall Renovation", client: "Retail Group", status: "In Progress", progress: 80 },
  { name: "Industrial Warehouse", client: "Logistics Inc", status: "Review", progress: 45 },
]

export function DashboardOverview() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-6">Dashboard Overview</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-card-foreground">{kpi.value}</p>
                  <p className="text-xs text-accent mt-2">{kpi.change} from last month</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-card-foreground">{project.name}</h4>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-card-foreground">{project.progress}%</p>
                    <div className="w-24 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  <Badge variant="secondary" className="min-w-[100px] justify-center">
                    {project.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

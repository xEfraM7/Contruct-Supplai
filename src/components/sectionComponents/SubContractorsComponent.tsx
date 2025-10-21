"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare } from "lucide-react"

const subcontractors = [
  { id: 1, name: "John Smith", role: "Electrician", company: "Spark Electric", status: "active" },
  { id: 2, name: "Maria Garcia", role: "Plumber", company: "Flow Pro", status: "active" },
  { id: 3, name: "David Lee", role: "HVAC Specialist", company: "Cool Air Systems", status: "active" },
  { id: 4, name: "Sarah Johnson", role: "Carpenter", company: "Woodworks Inc", status: "active" },
  { id: 5, name: "Michael Brown", role: "Roofer", company: "Top Roof Co", status: "active" },
  { id: 6, name: "Emily Davis", role: "Painter", company: "Color Masters", status: "active" },
  { id: 7, name: "Robert Wilson", role: "Mason", company: "Stone & Brick", status: "active" },
  { id: 8, name: "Jennifer Taylor", role: "Flooring", company: "Floor Experts", status: "active" },
]

export function SubContractorsComponent() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-6">Subcontractors</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subcontractors.map((sub) => (
          <Card key={sub.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold mb-3">
                  {sub.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <h3 className="font-semibold text-card-foreground">{sub.name}</h3>
                <p className="text-sm">{sub.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub.company}</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-border text-card-foreground hover:bg-muted bg-transparent"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

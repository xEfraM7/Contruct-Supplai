"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, MessageSquare, Clock, TrendingUp, Plus, Smile, Frown, Meh } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const metrics = [
  { label: "Total Calls", value: "156", icon: Phone },
  { label: "Messages Sent", value: "342", icon: MessageSquare },
  { label: "Avg Call Duration", value: "4:32", icon: Clock },
  { label: "Positive Sentiment", value: "87%", icon: TrendingUp },
]

const conversations = [
  { id: 1, contact: "Mike Johnson", type: "call", duration: "5:23", sentiment: "positive", timestamp: "2 hours ago" },
  { id: 2, contact: "Sarah Williams", type: "message", duration: "-", sentiment: "positive", timestamp: "3 hours ago" },
  { id: 3, contact: "Tom Anderson", type: "call", duration: "3:45", sentiment: "neutral", timestamp: "5 hours ago" },
  { id: 4, contact: "Lisa Brown", type: "message", duration: "-", sentiment: "negative", timestamp: "6 hours ago" },
]

export function AgentsPanelComponent() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-6">AI Agents</h2>

      {/* Create Agent */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-card-foreground">Create New AI Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <metric.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold text-card-foreground">{metric.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Conversations */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {conv.type === "call" ? (
                      <Phone className="w-5 h-5 text-primary" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground">{conv.contact}</h4>
                    <p className="text-sm text-muted-foreground">
                      {conv.type === "call" ? `Call - ${conv.duration}` : "Message"} • {conv.timestamp}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {conv.sentiment === "positive" && <Smile className="w-5 h-5 text-green-500" />}
                  {conv.sentiment === "neutral" && <Meh className="w-5 h-5 text-yellow-500" />}
                  {conv.sentiment === "negative" && <Frown className="w-5 h-5 text-red-500" />}
                  <Badge variant={conv.sentiment === "positive" ? "default" : "secondary"}>{conv.sentiment}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

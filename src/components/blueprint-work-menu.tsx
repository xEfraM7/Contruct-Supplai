"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Search } from "lucide-react"
import { useState } from "react"

const menuItems = ["Jobs", "Discrepancies", "RFIs"]

const jobCategories = [
  { name: "Windows", count: 12 },
  { name: "Drywall", count: 8 },
  { name: "Roofing", count: 5 },
  { name: "Plumbing", count: 15 },
  { name: "Electrical", count: 10 },
  { name: "HVAC", count: 6 },
]

export function BlueprintWorkMenu() {
  const [activeMenu, setActiveMenu] = useState("Jobs")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <section>
      <h2 className="text-2xl font-semibold text-foreground mb-6">Blueprint & Work Menu</h2>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-4 border-b border-border pb-4">
            {menuItems.map((item) => (
              <Button
                key={item}
                variant={activeMenu === item ? "default" : "ghost"}
                onClick={() => setActiveMenu(item)}
                className={activeMenu === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
              >
                {item}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Categories */}
          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Job Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {jobCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedCategory === category.name
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted/30 border-border text-card-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm opacity-80">{category.count} items</p>
                </button>
              ))}
            </div>
          </div>

          {/* Blueprint Search */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Search Blueprints</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter search prompt (e.g., 'Find all electrical outlets')"
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Upload Blueprint</label>
              <div className="relative">
                <Input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" id="blueprint-upload" />
                <label
                  htmlFor="blueprint-upload"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload PDF or Image</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

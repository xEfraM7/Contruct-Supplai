"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={`bg-card border-border transition-all duration-200 ${
        isOver ? "ring-2 ring-primary bg-primary/10 scale-[1.02] shadow-lg" : ""
      }`}
    >
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
            <h3 className="font-semibold text-card-foreground text-sm">{title}</h3>
          </div>
          <Badge 
            variant="secondary" 
            className={`text-xs font-medium ${isOver ? "bg-primary text-primary-foreground" : ""}`}
          >
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="min-h-[500px] max-h-[calc(100vh-280px)] overflow-y-auto p-3 custom-scrollbar">
        <div className={`transition-all duration-200 ${isOver ? "scale-[0.98]" : ""}`}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

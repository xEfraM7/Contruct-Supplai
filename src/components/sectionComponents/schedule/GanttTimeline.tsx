"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  Truck,
  AlertTriangle,
  Wrench,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConstructionEvent } from "@/types/schedule";
import { IntegratedEvent } from "@/hooks/useIntegratedSchedule";
import { themeColors } from "@/lib/theme";

interface GanttTimelineProps {
  events: IntegratedEvent[];
  onEditEvent: (event: ConstructionEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onStatusChange: (eventId: string, status: ConstructionEvent["status"]) => void;
}

const eventTypeConfig = {
  meeting: {
    icon: Users,
    color: themeColors.eventTypes.meeting.solid,
    label: themeColors.eventTypes.meeting.label,
  },
  inspection: {
    icon: CheckCircle,
    color: themeColors.eventTypes.inspection.solid,
    label: themeColors.eventTypes.inspection.label,
  },
  delivery: {
    icon: Truck,
    color: themeColors.eventTypes.delivery.solid,
    label: themeColors.eventTypes.delivery.label,
  },
  milestone: {
    icon: AlertTriangle,
    color: themeColors.eventTypes.milestone.solid,
    label: themeColors.eventTypes.milestone.label,
  },
  maintenance: {
    icon: Wrench,
    color: themeColors.eventTypes.maintenance.solid,
    label: themeColors.eventTypes.maintenance.label,
  },
  safety: {
    icon: AlertTriangle,
    color: themeColors.eventTypes.safety.solid,
    label: themeColors.eventTypes.safety.label,
  },
};

const statusConfig = {
  scheduled: {
    color: themeColors.scheduleStatus.scheduled.solid,
    label: themeColors.scheduleStatus.scheduled.label,
  },
  "in-progress": {
    color: themeColors.scheduleStatus["in-progress"].solid,
    label: themeColors.scheduleStatus["in-progress"].label,
  },
  completed: {
    color: themeColors.scheduleStatus.completed.solid,
    label: themeColors.scheduleStatus.completed.label,
  },
  cancelled: {
    color: themeColors.scheduleStatus.cancelled.solid,
    label: themeColors.scheduleStatus.cancelled.label,
  },
};

export function GanttTimeline({
  events,
  onEditEvent,
  onDeleteEvent,
  onStatusChange,
}: GanttTimelineProps) {
  // Calculate timeline range
  const { startDate, endDate, totalDays, weekDates } = useMemo(() => {
    if (events.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      
      return {
        startDate: start,
        endDate: end,
        totalDays: 37,
        weekDates: [] as Date[],
      };
    }

    const dates = events.flatMap((e) => [
      new Date(e.date),
      new Date(e.end_date),
    ]);
    
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const days = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate week markers
    const weeks: Date[] = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      weeks.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: days,
      weekDates: weeks,
    };
  }, [events]);

  // Calculate position and width for each event
  const getEventPosition = (event: IntegratedEvent) => {
    const eventStart = new Date(event.date);
    const eventEnd = new Date(event.end_date);
    
    const startOffset = Math.max(
      0,
      (eventStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration =
      (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, (duration / totalDays) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  // Sort events by start date
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [events]);

  if (events.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Gantt Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              No events to display
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Create events to see them in the timeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center justify-between">
          <span>Gantt Timeline</span>
          <span className="text-sm font-normal text-muted-foreground">
            {startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-border pb-2 mb-4">
              <div className="w-48 flex-shrink-0 font-medium text-sm text-muted-foreground">
                Event
              </div>
              <div className="flex-1 relative">
                <div className="flex justify-between text-xs text-muted-foreground">
                  {weekDates.map((date, index) => (
                    <div key={index} className="text-center">
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Rows */}
            <div className="space-y-3">
              {sortedEvents.map((event) => {
                const EventIcon = eventTypeConfig[event.type].icon;
                const position = getEventPosition(event);
                const today = new Date();
                const eventStart = new Date(event.date);
                const isOverdue =
                  eventStart < today && event.status !== "completed";

                return (
                  <div
                    key={event.id}
                    className="flex items-center group hover:bg-muted/30 rounded-lg p-2 transition-colors"
                  >
                    {/* Event Info */}
                    <div className="w-48 flex-shrink-0 pr-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1 rounded ${
                            eventTypeConfig[event.type].color
                          }`}
                        >
                          <EventIcon className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {event.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-10">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {weekDates.map((_, index) => (
                          <div
                            key={index}
                            className="flex-1 border-r border-border/30"
                          />
                        ))}
                      </div>

                      {/* Event Bar */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md flex items-center px-2 gap-1 cursor-pointer hover:opacity-90 transition-opacity ${
                          event.isAutoGenerated ? "border-2 border-white/30" : ""
                        }`}
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: `var(--${event.type}-color, ${
                            eventTypeConfig[event.type].color
                          })`,
                        }}
                        title={event.isAutoGenerated ? "Auto-generated from project" : ""}
                      >
                        <span className="text-xs font-medium text-white truncate flex-1">
                          {event.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-4 px-1 ${
                            statusConfig[event.status].color
                          } text-white border-0`}
                        >
                          {statusConfig[event.status].label}
                        </Badge>
                        {isOverdue && (
                          <AlertTriangle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-8 flex-shrink-0 ml-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEditEvent(event)}
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(event.id!, "in-progress")
                            }
                            disabled={
                              event.status === "in-progress" ||
                              event.status === "completed"
                            }
                          >
                            <Clock className="w-3 h-3 mr-2" />
                            Start
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(event.id!, "completed")
                            }
                            disabled={event.status === "completed"}
                          >
                            <CheckCircle className="w-3 h-3 mr-2" />
                            Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteEvent(event.id!)}
                            className={themeColors.interactive.delete.text}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

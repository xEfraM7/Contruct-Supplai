"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Plus,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Truck,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useScheduleLogic } from "@/hooks/useScheduleLogic";
import { EventFormDialog } from "./EventFormDialog";

const eventTypeConfig = {
  meeting: { icon: Users, color: "bg-blue-500", label: "Meeting" },
  inspection: { icon: CheckCircle, color: "bg-green-500", label: "Inspection" },
  delivery: { icon: Truck, color: "bg-orange-500", label: "Delivery" },
  milestone: {
    icon: AlertTriangle,
    color: "bg-purple-500",
    label: "Milestone",
  },
  maintenance: { icon: Wrench, color: "bg-yellow-500", label: "Maintenance" },
  safety: { icon: AlertTriangle, color: "bg-red-500", label: "Safety" },
};

const priorityConfig = {
  low: { color: "bg-gray-500", label: "Low" },
  medium: { color: "bg-blue-500", label: "Medium" },
  high: { color: "bg-orange-500", label: "High" },
  critical: { color: "bg-red-500", label: "Critical" },
};

const statusConfig = {
  scheduled: { color: "bg-blue-500", label: "Scheduled" },
  "in-progress": { color: "bg-yellow-500", label: "In Progress" },
  completed: { color: "bg-green-500", label: "Completed" },
  cancelled: { color: "bg-gray-500", label: "Cancelled" },
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ScheduleMainComponent() {
  const logic = useScheduleLogic();
  const calendarDays = logic.generateCalendar();

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Construction Schedule
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage events, inspections, and project deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-white text-black border-gray-300 hover:bg-gray-50 border"
            onClick={() => logic.setIsAddEventOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Event Form Dialogs */}
      <EventFormDialog
        open={logic.isAddEventOpen}
        onOpenChange={(open) => {
          logic.setIsAddEventOpen(open);
          if (!open) logic.resetForm();
        }}
        title="Create New Event"
        formData={logic.formData}
        setFormData={logic.setFormData}
        onSubmit={logic.handleCreateEvent}
        isPending={logic.isPending}
        submitLabel="Create Event"
      />

      <EventFormDialog
        open={logic.isEditEventOpen}
        onOpenChange={(open) => {
          logic.setIsEditEventOpen(open);
          if (!open) {
            logic.resetForm();
          }
        }}
        title="Edit Event"
        formData={logic.formData}
        setFormData={logic.setFormData}
        onSubmit={logic.handleUpdateEvent}
        isPending={logic.isPending}
        submitLabel="Update Event"
      />

      {/* Schedule Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {monthNames[logic.currentDate.getMonth()]}{" "}
              {logic.currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  logic.setCurrentDate(
                    new Date(
                      logic.currentDate.getFullYear(),
                      logic.currentDate.getMonth() - 1
                    )
                  )
                }
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logic.setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  logic.setCurrentDate(
                    new Date(
                      logic.currentDate.getFullYear(),
                      logic.currentDate.getMonth() + 1
                    )
                  )
                }
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logic.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dayEvents = logic.getEventsForDate(day);
                    const isCurrentMonth =
                      day.getMonth() === logic.currentDate.getMonth();
                    const isToday =
                      day.toDateString() === new Date().toDateString();
                    const isSelected =
                      logic.selectedDate?.toDateString() === day.toDateString();

                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] p-1 border border-border/50 cursor-pointer transition-colors
                          ${isCurrentMonth ? "bg-background" : "bg-muted/30"}
                          ${isToday ? "bg-primary/10 border-primary" : ""}
                          ${isSelected ? "bg-primary/20" : ""}
                          hover:bg-muted/50
                        `}
                        onClick={() => logic.setSelectedDate(day)}
                      >
                        <div
                          className={`text-sm ${
                            isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground"
                          } ${isToday ? "font-bold" : ""}`}
                        >
                          {day.getDate()}
                        </div>
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map((event) => {
                            const EventIcon = eventTypeConfig[event.type].icon;
                            const isMultiDay = event.date !== event.end_date;
                            const isStartDate =
                              event.date === day.toISOString().split("T")[0];
                            const isEndDate =
                              event.end_date ===
                              day.toISOString().split("T")[0];
                            const isMiddleDate = !isStartDate && !isEndDate;

                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded text-white truncate ${
                                  eventTypeConfig[event.type].color
                                } ${isMultiDay ? "relative" : ""}`}
                                title={`${event.title}${
                                  isMultiDay
                                    ? ` (${
                                        isStartDate
                                          ? "Start"
                                          : isEndDate
                                          ? "End"
                                          : "Continues"
                                      })`
                                    : ""
                                }`}
                              >
                                <EventIcon className="w-3 h-3 inline mr-1" />
                                {isMultiDay && isMiddleDate ? "••• " : ""}
                                {event.title}
                                {isMultiDay && (
                                  <span className="absolute -right-1 -top-1 w-2 h-2 bg-white rounded-full opacity-70" />
                                )}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logic.events
                .filter((event) => event.end_date >= logic.todayString)
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .slice(0, 5)
                .map((event) => {
                  const EventIcon = eventTypeConfig[event.type].icon;
                  return (
                    <div
                      key={event.id}
                      className="border border-border rounded-lg p-3 space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`p-1 rounded ${
                              eventTypeConfig[event.type].color
                            }`}
                          >
                            <EventIcon className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {event.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString("en-US")}{" "}
                              • {event.start_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              priorityConfig[event.priority].color
                            } text-white`}
                          >
                            {priorityConfig[event.priority].label}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  logic.openEditDialog(event as any)
                                }
                              >
                                <Edit className="w-3 h-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  logic.handleStatusChange(
                                    event.id!,
                                    "completed"
                                  )
                                }
                                disabled={event.status === "completed"}
                              >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  logic.handleDeleteEvent(event.id!)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            statusConfig[event.status].color
                          } text-white border-0`}
                        >
                          {statusConfig[event.status].label}
                        </Badge>
                        {event.assigned_to && event.assigned_to.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {event.assigned_to.slice(0, 2).join(", ")}
                            {event.assigned_to.length > 2 &&
                              ` +${event.assigned_to.length - 2}`}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              {logic.events.filter(
                (event) => event.end_date >= logic.todayString
              ).length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No upcoming events
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your scheduled events will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Today&apos;s Events
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {logic.todayEvents.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {logic.todayEvents.length === 0
                    ? "No events today"
                    : `${logic.todayEvents.length} event${
                        logic.todayEvents.length > 1 ? "s" : ""
                      } scheduled`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-3xl font-bold text-card-foreground">
                  {logic.thisWeekEvents.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Events scheduled
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Overdue Tasks
                </p>
                <p className="text-3xl font-bold text-red-500">
                  {logic.overdueTasks.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {logic.overdueTasks.length === 0
                    ? "No overdue tasks"
                    : "Need attention"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Inspections
                </p>
                <p className="text-3xl font-bold text-green-500">
                  {logic.events.filter((e) => e.type === "inspection").length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Scheduled this month
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Modal */}
      {logic.selectedDate && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Events for{" "}
              {logic.selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logic.getEventsForDate(logic.selectedDate).map((event) => {
                const EventIcon = eventTypeConfig[event.type].icon;
                return (
                  <div
                    key={event.id}
                    className="border border-border rounded-lg p-4 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            eventTypeConfig[event.type].color
                          }`}
                        >
                          <EventIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.date === event.end_date
                              ? `${event.start_time} - ${event.end_time}`
                              : `${new Date(event.date).toLocaleDateString(
                                  "en-US"
                                )} - ${new Date(
                                  event.end_date
                                ).toLocaleDateString("en-US")} • ${
                                  event.start_time
                                } - ${event.end_time}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge
                          variant="secondary"
                          className={`${
                            priorityConfig[event.priority].color
                          } text-white`}
                        >
                          {priorityConfig[event.priority].label}
                        </Badge>
                        <Badge variant="outline">
                          {eventTypeConfig[event.type].label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${
                            statusConfig[event.status].color
                          } text-white border-0`}
                        >
                          {statusConfig[event.status].label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                logic.openEditDialog(event as any)
                              }
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                logic.handleStatusChange(
                                  event.id!,
                                  "in-progress"
                                )
                              }
                              disabled={
                                event.status === "in-progress" ||
                                event.status === "completed"
                              }
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Start Event
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                logic.handleStatusChange(event.id!, "completed")
                              }
                              disabled={event.status === "completed"}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => logic.handleDeleteEvent(event.id!)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      {event.assigned_to && event.assigned_to.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{event.assigned_to.join(", ")}</span>
                        </div>
                      )}
                      {event.project_id && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          <span>Project: {event.project_id}</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded">
                        {event.description}
                      </p>
                    )}
                  </div>
                );
              })}
              {logic.getEventsForDate(logic.selectedDate).length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No events scheduled for this date
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <logic.ConfirmDialog />
    </section>
  );
}

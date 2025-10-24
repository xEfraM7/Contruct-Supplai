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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { useState, useEffect, useTransition } from "react";
import { createEvent, getEvents, updateEvent, deleteEvent, updateEventStatus, type ConstructionEvent } from "@/lib/actions/schedule-actions";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";

// Event type configurations for construction management
const eventTypeConfig = {
  meeting: { icon: Users, color: "bg-blue-500", label: "Meeting" },
  inspection: { icon: CheckCircle, color: "bg-green-500", label: "Inspection" },
  delivery: { icon: Truck, color: "bg-orange-500", label: "Delivery" },
  milestone: { icon: AlertTriangle, color: "bg-purple-500", label: "Milestone" },
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

interface EventFormData {
  title: string;
  description: string;
  date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  type: ConstructionEvent["type"];
  priority: ConstructionEvent["priority"];
  location: string;
  assigned_to: string;
  project_id: string;
}

export function ScheduleComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ConstructionEvent | null>(null);

  const [events, setEvents] = useState<ConstructionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { confirm, ConfirmDialog } = useConfirm();

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    type: "meeting",
    priority: "medium",
    location: "",
    assigned_to: "",
    project_id: "",
  });

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const result = await getEvents();
      if (result.success) {
        setEvents(result.data || []);
      } else {
        toast.error("Failed to load events");
      }
    } catch {
      toast.error("Error loading events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.date || !formData.end_date || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.date)) {
      toast.error("End date cannot be before start date");
      return;
    }

    startTransition(async () => {
      try {
        const eventData = {
          ...formData,
          assigned_to: formData.assigned_to.split(",").map(s => s.trim()).filter(Boolean),
          status: "scheduled" as const,
        };

        const result = await createEvent(eventData);
        if (result.success) {
          toast.success("Event created successfully");
          setIsAddEventOpen(false);
          resetForm();
          await loadEvents();
        } else {
          toast.error(result.error || "Failed to create event");
        }
      } catch {
        toast.error("Error creating event");
      }
    });
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !formData.title || !formData.date || !formData.end_date || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.date)) {
      toast.error("End date cannot be before start date");
      return;
    }

    startTransition(async () => {
      try {
        const eventData = {
          ...formData,
          assigned_to: formData.assigned_to.split(",").map(s => s.trim()).filter(Boolean),
        };

        const result = await updateEvent(editingEvent.id!, eventData);
        if (result.success) {
          toast.success("Event updated successfully");
          setIsEditEventOpen(false);
          setEditingEvent(null);
          resetForm();
          await loadEvents();
        } else {
          toast.error(result.error || "Failed to update event");
        }
      } catch {
        toast.error("Error updating event");
      }
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = await confirm({
      title: "Delete Event",
      description: "Are you sure you want to delete this event? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const result = await deleteEvent(eventId);
        if (result.success) {
          toast.success("Event deleted successfully");
          await loadEvents();
        } else {
          toast.error(result.error || "Failed to delete event");
        }
      } catch {
        toast.error("Error deleting event");
      }
    });
  };

  const handleStatusChange = async (eventId: string, status: ConstructionEvent["status"]) => {
    startTransition(async () => {
      try {
        const result = await updateEventStatus(eventId, status);
        if (result.success) {
          toast.success("Event status updated");
          await loadEvents();
        } else {
          toast.error(result.error || "Failed to update status");
        }
      } catch {
        toast.error("Error updating status");
      }
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      type: "meeting",
      priority: "medium",
      location: "",
      assigned_to: "",
      project_id: "",
    });
  };

  const openEditDialog = (event: ConstructionEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      date: event.date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      type: event.type,
      priority: event.priority,
      location: event.location,
      assigned_to: event.assigned_to.join(", "),
      project_id: event.project_id || "",
    });
    setIsEditEventOpen(true);
  };

  // Generate calendar grid
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendar();

  // Get events for a specific date (including multi-day events)
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const startDate = event.date;
      const endDate = event.end_date;
      return dateString >= startDate && dateString <= endDate;
    });
  };

  // Calculate statistics
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const todayEvents = events.filter(event => 
    todayString >= event.date && todayString <= event.end_date
  );
  
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };
  
  const getWeekEnd = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 6;
    return new Date(d.setDate(diff));
  };
  
  const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];
  const weekEnd = getWeekEnd(new Date()).toISOString().split('T')[0];
  
  const thisWeekEvents = events.filter(event => 
    (event.date >= weekStart && event.date <= weekEnd) ||
    (event.end_date >= weekStart && event.end_date <= weekEnd) ||
    (event.date <= weekStart && event.end_date >= weekEnd)
  );
  
  const overdueTasks = events.filter(event => 
    event.end_date < todayString && event.status !== "completed"
  );

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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
          <Dialog open={isAddEventOpen} onOpenChange={(open) => {
            setIsAddEventOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black border-gray-300 hover:bg-gray-50 border">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Foundation Inspection"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Event Type *</Label>
                  <Select value={formData.type} onValueChange={(value: ConstructionEvent["type"]) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Start Date *</Label>
                    <DateInput 
                      id="date" 
                      value={formData.date}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          date: e.target.value,
                          end_date: prev.end_date || e.target.value // Auto-set end date if empty
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date *</Label>
                    <DateInput 
                      id="end_date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: ConstructionEvent["priority"]) => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="multi_day_info" className="text-xs text-muted-foreground">
                      Multi-day events will appear on all days between start and end date
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input 
                      id="startTime" 
                      type="time" 
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input 
                      id="endTime" 
                      type="time" 
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Main Site - Sector A"
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Input
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    placeholder="e.g., John Doe, Jane Smith (comma separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="project_id">Project ID</Label>
                  <Input
                    id="project_id"
                    value={formData.project_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                    placeholder="e.g., PROJ-001"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event details..."
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateEvent}
                  disabled={isPending}
                >
                  {isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Event Dialog */}
          <Dialog open={isEditEventOpen} onOpenChange={(open) => {
            setIsEditEventOpen(open);
            if (!open) {
              setEditingEvent(null);
              resetForm();
            }
          }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Foundation Inspection"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Event Type *</Label>
                  <Select value={formData.type} onValueChange={(value: ConstructionEvent["type"]) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-date">Start Date *</Label>
                    <DateInput 
                      id="edit-date" 
                      value={formData.date}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          date: e.target.value,
                          end_date: prev.end_date || e.target.value
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end_date">End Date *</Label>
                    <DateInput 
                      id="edit-end_date" 
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: ConstructionEvent["priority"]) => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_multi_day_info" className="text-xs text-muted-foreground">
                      Multi-day events span from start to end date
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-startTime">Start Time *</Label>
                    <Input 
                      id="edit-startTime" 
                      type="time" 
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endTime">End Time *</Label>
                    <Input 
                      id="edit-endTime" 
                      type="time" 
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location *</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Main Site - Sector A"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-assigned_to">Assigned To</Label>
                  <Input
                    id="edit-assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    placeholder="e.g., John Doe, Jane Smith (comma separated)"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-project_id">Project ID</Label>
                  <Input
                    id="edit-project_id"
                    value={formData.project_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                    placeholder="e.g., PROJ-001"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event details..."
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleUpdateEvent}
                  disabled={isPending}
                >
                  {isPending ? "Updating..." : "Update Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1
                    )
                  )
                }
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1
                    )
                  )
                }
              >
                →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth =
                      day.getMonth() === currentDate.getMonth();
                    const isToday =
                      day.toDateString() === new Date().toDateString();
                    const isSelected =
                      selectedDate?.toDateString() === day.toDateString();

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
                        onClick={() => setSelectedDate(day)}
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
                            const isStartDate = event.date === day.toISOString().split('T')[0];
                            const isEndDate = event.end_date === day.toISOString().split('T')[0];
                            const isMiddleDate = !isStartDate && !isEndDate;
                            
                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded text-white truncate ${
                                  eventTypeConfig[event.type].color
                                } ${isMultiDay ? 'relative' : ''}`}
                                title={`${event.title}${isMultiDay ? ` (${isStartDate ? 'Start' : isEndDate ? 'End' : 'Continues'})` : ''}`}
                              >
                                <EventIcon className="w-3 h-3 inline mr-1" />
                                {isMultiDay && isMiddleDate ? '••• ' : ''}
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
              {events
                .filter((event) => event.end_date >= todayString)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
                              {new Date(event.date).toLocaleDateString("en-US")} • {event.start_time}
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
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(event)}>
                                <Edit className="w-3 h-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(event.id!, "completed")}
                                disabled={event.status === "completed"}
                              >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteEvent(event.id!)}
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
                          className={`text-xs ${statusConfig[event.status].color} text-white border-0`}
                        >
                          {statusConfig[event.status].label}
                        </Badge>
                        {event.assigned_to.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {event.assigned_to.slice(0, 2).join(", ")}
                            {event.assigned_to.length > 2 && ` +${event.assigned_to.length - 2}`}
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
              {events.filter((event) => event.end_date >= todayString).length === 0 && (
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
                  {todayEvents.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {todayEvents.length === 0
                    ? "No events today"
                    : `${todayEvents.length} event${
                        todayEvents.length > 1 ? "s" : ""
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
                <p className="text-sm text-muted-foreground mb-1">
                  This Week
                </p>
                <p className="text-3xl font-bold text-card-foreground">
                  {thisWeekEvents.length}
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
                  {overdueTasks.length}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {overdueTasks.length === 0
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
                  {events.filter((e) => e.type === "inspection").length}
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
      {selectedDate && (
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Events for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getEventsForDate(selectedDate).map((event) => {
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
                              : `${new Date(event.date).toLocaleDateString("en-US")} - ${new Date(event.end_date).toLocaleDateString("en-US")} • ${event.start_time} - ${event.end_time}`
                            }
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
                          className={`${statusConfig[event.status].color} text-white border-0`}
                        >
                          {statusConfig[event.status].label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(event)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(event.id!, "in-progress")}
                              disabled={event.status === "in-progress" || event.status === "completed"}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Start Event
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(event.id!, "completed")}
                              disabled={event.status === "completed"}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEvent(event.id!)}
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
                      {event.assigned_to.length > 0 && (
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
              {getEventsForDate(selectedDate).length === 0 && (
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
      <ConfirmDialog />
    </section>
  );
}

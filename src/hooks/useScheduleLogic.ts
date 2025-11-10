"use client";

import { useState, useTransition } from "react";
import { type ConstructionEvent } from "@/lib/actions/schedule-actions";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useUpdateEventStatus,
} from "@/lib/hooks/use-schedule";
import { useIntegratedSchedule } from "@/hooks/useIntegratedSchedule";

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

export function useScheduleLogic() {
  const { events, isLoading, scheduleEventsCount, projectMilestonesCount } = useIntegratedSchedule();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const updateEventStatusMutation = useUpdateEventStatus();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ConstructionEvent | null>(null);
  const [isPending, startTransition] = useTransition();
  const { confirm, ConfirmDialog } = useConfirm();

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

  const handleCreateEvent = async () => {
    if (
      !formData.title ||
      !formData.date ||
      !formData.end_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
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
          assigned_to: formData.assigned_to
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          status: "scheduled" as const,
        };

        await createEventMutation.mutateAsync(eventData);
        setIsAddEventOpen(false);
        resetForm();
      } catch {
        // Error is handled by the mutation
      }
    });
  };

  const handleUpdateEvent = async () => {
    if (
      !editingEvent ||
      !formData.title ||
      !formData.date ||
      !formData.end_date ||
      !formData.start_time ||
      !formData.end_time
    ) {
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
          assigned_to: formData.assigned_to
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        };

        await updateEventMutation.mutateAsync({
          id: editingEvent.id!,
          data: eventData,
        });
        setIsEditEventOpen(false);
        setEditingEvent(null);
        resetForm();
      } catch {
        // Error is handled by the mutation
      }
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = await confirm({
      title: "Delete Event",
      description:
        "Are you sure you want to delete this event? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteEventMutation.mutateAsync(eventId);
      } catch {
        // Error is handled by the mutation
      }
    });
  };

  const handleStatusChange = async (
    eventId: string,
    status: ConstructionEvent["status"]
  ) => {
    startTransition(async () => {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, status });
      } catch {
        // Error is handled by the mutation
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

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const startDate = event.date;
      const endDate = event.end_date;
      return dateString >= startDate && dateString <= endDate;
    });
  };

  // Calculate statistics
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const todayEvents = events.filter(
    (event) => todayString >= event.date && todayString <= event.end_date
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

  const weekStart = getWeekStart(new Date()).toISOString().split("T")[0];
  const weekEnd = getWeekEnd(new Date()).toISOString().split("T")[0];

  const thisWeekEvents = events.filter(
    (event) =>
      (event.date >= weekStart && event.date <= weekEnd) ||
      (event.end_date >= weekStart && event.end_date <= weekEnd) ||
      (event.date <= weekStart && event.end_date >= weekEnd)
  );

  const overdueTasks = events.filter(
    (event) => event.end_date < todayString && event.status !== "completed"
  );

  return {
    // Data
    events,
    isLoading,
    currentDate,
    selectedDate,
    isAddEventOpen,
    isEditEventOpen,
    editingEvent,
    isPending,
    formData,
    todayEvents,
    thisWeekEvents,
    overdueTasks,
    todayString,
    scheduleEventsCount,
    projectMilestonesCount,
    ConfirmDialog,

    // Actions
    setCurrentDate,
    setSelectedDate,
    setIsAddEventOpen,
    setIsEditEventOpen,
    setFormData,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleStatusChange,
    resetForm,
    openEditDialog,
    generateCalendar,
    getEventsForDate,
  };
}

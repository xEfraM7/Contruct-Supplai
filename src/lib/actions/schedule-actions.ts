"use server";

import { createSupabaseServerClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

export interface ConstructionEvent {
  id?: string;
  title: string;
  description: string;
  date: string; // ISO date string (start date)
  end_date: string; // ISO date string (end date)
  start_time: string;
  end_time: string;
  type:
    | "meeting"
    | "inspection"
    | "delivery"
    | "milestone"
    | "maintenance"
    | "safety";
  priority: "low" | "medium" | "high" | "critical";
  location: string;
  assigned_to: string[];
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  project_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export async function getEvents() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("construction_events")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error in getEvents:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function createEvent(
  eventData: Omit<
    ConstructionEvent,
    "id" | "created_at" | "updated_at" | "user_id"
  >
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("construction_events")
      .insert({
        ...eventData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create event");
    }

    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error) {
    console.error("Error in createEvent:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  eventData: Partial<ConstructionEvent>
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("construction_events")
      .update({
        ...eventData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update event");
    }

    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error) {
    console.error("Error in updateEvent:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("construction_events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete event");
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteEvent:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function updateEventStatus(
  id: string,
  status: ConstructionEvent["status"]
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("construction_events")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating event status:", error);
      throw new Error("Failed to update event status");
    }

    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error) {
    console.error("Error in updateEventStatus:", error);
    return { success: false, error: "Failed to update event status" };
  }
}

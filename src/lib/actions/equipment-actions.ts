"use server";

import { createSupabaseServerClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

export interface Equipment {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  tag: string;
  category: string;
  status: "available" | "checked_out" | "maintenance";
  location: string | null;
  next_maintenance: string | null;
  last_maintenance: string | null;
  maintenance_interval_days: number;
  value: number;
  quantity: number;
  purchase_date: string | null;
  assigned_to: string | null;
  checked_out_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentData {
  name: string;
  tag: string;
  category: string;
  status?: "available" | "checked_out" | "maintenance";
  location?: string;
  next_maintenance?: string;
  value: number;
  quantity?: number;
  purchase_date?: string;
  notes?: string;
  maintenance_interval_days?: number;
}

export async function getEquipment() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, equipment: data as Equipment[] };
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return { success: false, error: "Failed to fetch equipment" };
  }
}

export async function createEquipment(data: CreateEquipmentData) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: equipment, error } = await supabase
      .from("equipment")
      .insert({
        user_id: user.id,
        name: data.name,
        tag: data.tag,
        category: data.category,
        status: data.status || "available",
        location: data.location || null,
        next_maintenance: data.next_maintenance || null,
        value: data.value,
        quantity: data.quantity || 1,
        purchase_date: data.purchase_date || null,
        notes: data.notes || null,
        maintenance_interval_days: data.maintenance_interval_days || 180,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/equipment");
    return { success: true, equipment };
  } catch (error) {
    console.error("Error creating equipment:", error);
    return { success: false, error: "Failed to create equipment" };
  }
}

export async function updateEquipment(
  id: string,
  data: Partial<CreateEquipmentData>
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: equipment, error } = await supabase
      .from("equipment")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/equipment");
    return { success: true, equipment };
  } catch (error) {
    console.error("Error updating equipment:", error);
    return { success: false, error: "Failed to update equipment" };
  }
}

export async function deleteEquipment(id: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("equipment")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/equipment");
    return { success: true };
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return { success: false, error: "Failed to delete equipment" };
  }
}

export async function checkOutEquipment(id: string, assignedTo?: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: equipment, error } = await supabase
      .from("equipment")
      .update({
        status: "checked_out",
        checked_out_date: new Date().toISOString(),
        assigned_to: assignedTo || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/equipment");
    return { success: true, equipment };
  } catch (error) {
    console.error("Error checking out equipment:", error);
    return { success: false, error: "Failed to check out equipment" };
  }
}

export async function scheduleMaintenanceEquipment(
  id: string,
  nextMaintenanceDate: string
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: equipment, error } = await supabase
      .from("equipment")
      .update({
        status: "maintenance",
        next_maintenance: nextMaintenanceDate,
        last_maintenance: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/equipment");
    return { success: true, equipment };
  } catch (error) {
    console.error("Error scheduling maintenance:", error);
    return { success: false, error: "Failed to schedule maintenance" };
  }
}

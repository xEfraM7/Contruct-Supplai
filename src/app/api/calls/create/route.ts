import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

// POST - Crear una llamada telefónica
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      from_number,
      to_number,
      agent_id,
      contact_id,
      metadata = {},
    } = body;

    if (!from_number || !to_number || !agent_id) {
      return NextResponse.json(
        { error: "from_number, to_number, and agent_id are required" },
        { status: 400 }
      );
    }

    // Crear llamada en Retell AI
    const callResponse = await retellClient.call.createPhoneCall({
      from_number,
      to_number,
      override_agent_id: agent_id,
      metadata: {
        ...metadata,
        contact_id,
        user_id: user.id,
      },
    });

    // Guardar en Supabase
    const { data: call, error } = await supabase
      .from("retell_calls")
      .insert({
        user_id: user.id,
        contact_id: contact_id || null,
        agent_id,
        call_id: callResponse.call_id,
        from_number,
        to_number,
        call_status: callResponse.call_status,
        direction: "outbound",
        start_timestamp: callResponse.start_timestamp || null,
        metadata: {
          ...metadata,
          contact_id,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving call to database:", error);
    }

    return NextResponse.json(
      { call: call || callResponse, retell_response: callResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating call:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error creating call";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

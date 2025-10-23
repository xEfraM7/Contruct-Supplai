import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - Obtener el número de teléfono configurado para hacer llamadas
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phoneNumber = process.env.RETELL_PHONE_NUMBER || '+17867888256';

    return NextResponse.json({ phone_number: phoneNumber });
  } catch (error) {
    console.error('Error fetching phone number:', error);
    return NextResponse.json({ error: 'Error fetching phone number' }, { status: 500 });
  }
}

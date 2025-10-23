import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || '',
});

// GET - Listar todos los LLMs disponibles
export async function GET() {
  try {
    const llms = await retellClient.llm.list();
    return NextResponse.json({ llms: llms || [] });
  } catch (error) {
    console.error('Error fetching LLMs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener LLMs';
    return NextResponse.json(
      { error: errorMessage, llms: [] },
      { status: 500 }
    );
  }
}

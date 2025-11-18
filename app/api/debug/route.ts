import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const configured = isSupabaseConfigured();
    
    // Obtener información sobre las variables disponibles (sin mostrar valores)
    const envKeys = Object.keys(process.env);
    const supabaseUrlKeys = envKeys.filter(k => k.includes('SUPABASE') && k.includes('URL'));
    const supabaseKeyKeys = envKeys.filter(k => 
      k.includes('SUPABASE') && (k.includes('KEY') || k.includes('ANON'))
    );

    return NextResponse.json({
      configured,
      message: configured
        ? 'Supabase está configurado correctamente'
        : 'Supabase NO está configurado. Verifica las variables de entorno.',
      supabaseUrlKeysFound: supabaseUrlKeys.length > 0,
      supabaseKeyKeysFound: supabaseKeyKeys.length > 0,
      supabaseUrlKeys: supabaseUrlKeys,
      supabaseKeyKeys: supabaseKeyKeys,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        error: true,
      },
      { status: 500 }
    );
  }
}


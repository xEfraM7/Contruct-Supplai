import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtener la sesión del usuario
  const { data: { session } } = await supabase.auth.getSession();

  // Si no hay sesión y está intentando acceder a una ruta protegida, redirigir a login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

// 👇 Aquí defines las rutas protegidas
export const config = {
  matcher: ['/overview/:path*', '/agents/:path*', '/blueprints/:path*', '/subcontractors/:path*', '/analytics/:path*'],
};

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

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

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = [
    '/overview', 
    '/agents', 
    '/blueprints', 
    '/subcontractors', 
    '/analytics', 
    '/equipment', 
    '/settings'
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Si el usuario está logueado y trata de acceder a login, redirigir a overview
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/overview', req.url));
  }

  // Si el usuario no está logueado y trata de acceder a una ruta protegida, redirigir a login
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si el usuario no está logueado y está en la raíz (/), redirigir a login
  if (!session && pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si el usuario está logueado y está en la raíz (/), redirigir a overview
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/overview', req.url));
  }

  return res;
}

// 👇 Configuración del middleware - incluye todas las rutas que necesitan validación
export const config = {
  matcher: [
    // Rutas protegidas
    '/overview/:path*',
    '/agents/:path*', 
    '/blueprints/:path*',
    '/subcontractors/:path*',
    '/analytics/:path*',
    '/equipment/:path*',
    '/settings/:path*',
    // Rutas públicas que necesitan validación (para redirigir si ya está logueado)
    '/login',
    // Ruta raíz para redirigir según estado de autenticación
    '/',
    // Excluir rutas de API y archivos estáticos
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

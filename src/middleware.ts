import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');
  const isDashboard = 
    request.nextUrl.pathname.startsWith('/overview') ||
    request.nextUrl.pathname.startsWith('/agents') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/blueprints') ||
    request.nextUrl.pathname.startsWith('/clients') ||
    request.nextUrl.pathname.startsWith('/equipment') ||
    request.nextUrl.pathname.startsWith('/schedule') ||
    request.nextUrl.pathname.startsWith('/settings');

  // Si está en callback, dejar pasar
  if (isAuthCallback) {
    return response;
  }

  // Si no está autenticado y trata de acceder al dashboard, redirigir a login
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si está autenticado y trata de acceder a login, redirigir a overview
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  // Si está en la raíz y autenticado, redirigir a overview
  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  // Si está en la raíz y NO autenticado, redirigir a login
  if (!user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/overview/:path*',
    '/agents/:path*',
    '/analytics/:path*',
    '/blueprints/:path*',
    '/clients/:path*',
    '/equipment/:path*',
    '/schedule/:path*',
    '/settings/:path*',
  ],
};

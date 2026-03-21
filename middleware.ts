import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/properties',
  '/visit',
];

// Routes par rôle
const roleRoutes = {
  admin: ['/admin'],
  owner: ['/owner'],
  tenant: ['/tenant'],
};

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes('[')) {
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

function getRoleFromPath(pathname: string): string | null {
  for (const [role, routes] of Object.entries(roleRoutes)) {
    for (const route of routes) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return role;
      }
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si c'est une route publique, autoriser l'accès
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Vérifier si l'utilisateur est authentifié via les cookies
  const token = request.cookies.get('access_token')?.value;
  
  if (!token) {
    // Rediriger vers la page de connexion avec l'URL de retour
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier si l'utilisateur a le bon rôle pour accéder à cette route
  const requiredRole = getRoleFromPath(pathname);
  const userRole = request.cookies.get('user_role')?.value;

  if (requiredRole && userRole && requiredRole !== userRole) {
    // Rediriger vers la page d'accueil si le rôle ne correspond pas
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that don't require approval
const PUBLIC_ROUTES = ['/login', '/signup', '/auth', '/pending-approval', '/api/auth'];

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // Skip approval check for public routes or unauthenticated users
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    if (!user || isPublicRoute) {
        return response;
    }

    // Check if user is approved or admin
    const { data: appUser } = await supabase
        .from('users')
        .select('is_approved, role')
        .eq('id', user.id)
        .single();

    const isApprovedOrAdmin = appUser?.is_approved === true || appUser?.role === 'admin';

    // Redirect unapproved users to pending page
    if (!isApprovedOrAdmin) {
        return NextResponse.redirect(new URL('/pending-approval', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

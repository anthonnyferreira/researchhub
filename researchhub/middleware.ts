import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUSPENDED_ROUTE = "/conta-suspensa";
const ALLOWED_WHILE_SUSPENDED = [
  SUSPENDED_ROUTE,
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/auth",
];

function isAllowedWhileSuspended(pathname: string) {
  return ALLOWED_WHILE_SUSPENDED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  return target;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Renova a sessão antes de consultar o status no perfil da aplicação.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!authUser) {
    if (pathname === SUSPENDED_ROUTE) {
      return copyResponseCookies(
        response,
        NextResponse.redirect(new URL("/login", request.url))
      );
    }

    return response;
  }

  // Falha aberta somente para indisponibilidade de leitura. A segurança
  // efetiva das escritas continua garantida pelas policies RLS.
  const { data: appUser, error } = await supabase
    .from("users")
    .select("status")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (error || !appUser) return response;

  if (appUser.status === "suspended") {
    if (isAllowedWhileSuspended(pathname)) return response;

    if (pathname.startsWith("/api/")) {
      return copyResponseCookies(
        response,
        NextResponse.json(
          { error: "ACCOUNT_SUSPENDED", message: "Esta conta está suspensa." },
          { status: 403 }
        )
      );
    }

    return copyResponseCookies(
      response,
      NextResponse.redirect(new URL(SUSPENDED_ROUTE, request.url))
    );
  }

  // Uma conta reativada não fica presa na página de suspensão.
  if (pathname === SUSPENDED_ROUTE) {
    return copyResponseCookies(
      response,
      NextResponse.redirect(new URL("/dashboard", request.url))
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

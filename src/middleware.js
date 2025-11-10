import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing.js";

const intlMiddleware = createIntlMiddleware(routing);

const SUPPORTED_LOCALES = ["en", "ar"];

const PUBLIC_ROUTES = ["/auth/signin", "/auth/signup"];

function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

function getUserLocale(request) {
  const cookies = request.cookies;
  const localeCookie = cookies.get("NEXT_LOCALE")?.value;

  if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie)) {
    return localeCookie;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const primaryLang = acceptLanguage.split(",")[0].split("-")[0];
    if (SUPPORTED_LOCALES.includes(primaryLang)) {
      return primaryLang;
    }
  }

  return "en";
}

export default async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Detect locale prefix (e.g. /en, /ar)
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  const hasLocalePrefix = Boolean(localeMatch);

  const locale = hasLocalePrefix ? localeMatch[1] : getUserLocale(request);
  const pathWithoutLocale = hasLocalePrefix ? localeMatch[2] || "/" : pathname;

  //  Verify session with getToken
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuth = Boolean(token);
  const isPublic = isPublicRoute(pathWithoutLocale);

  //  Not authenticated & protected route → redirect to signin with callbackUrl
  if (!isAuth && !isPublic) {
    const redirectUrl = new URL(`/${locale}/auth/signin`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  //   Authenticated & on signin/signup → redirect to dashboard
  if (isAuth && isPublic) {
    return NextResponse.redirect(new URL(`/${locale}/`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

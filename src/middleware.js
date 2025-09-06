// import createMiddleware from "next-intl/middleware";
// import { routing } from "./i18n/routing";

// export default createMiddleware(routing);

// export const config = {
//   matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
// };

import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const signInPage = "/auth/signin"; // ✅ centralize signin path

function isAuthenticated(req) {
  return Boolean(
    req.cookies.get("auth-token")?.value || req.cookies.get("session")?.value
  );
}

function getUserLocale(req) {
  const locale = req.cookies.get("locale")?.value;
  if (["en", "ar"].includes(locale)) return locale;

  const acceptLanguage = req.headers.get("accept-language") || "";
  return acceptLanguage.includes("ar") ? "ar" : "en";
}

export default function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = isAuthenticated(req);
  const userLocale = getUserLocale(req);

  // Normalize path (strip locale prefix like /en or /ar)
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  const pathWithoutLocale = ["en", "ar"].includes(maybeLocale)
    ? `/${segments.slice(2).join("/")}`
    : pathname;

  // ✅ If logged in and tries to access signin → redirect home
  if (token && pathWithoutLocale === signInPage) {
    return NextResponse.redirect(new URL(`/${userLocale}`, req.url));
  }

  // If not logged in and hits protected route → redirect to signin
  if (
    !token &&
    protectedRoutes.some((route) => pathWithoutLocale.startsWith(route))
  ) {
    return NextResponse.redirect(
      new URL(`/${userLocale}${signInPage}`, req.url)
    );
  }

  // If logged in and visiting `/` → go to locale root
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL(`/${userLocale}`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

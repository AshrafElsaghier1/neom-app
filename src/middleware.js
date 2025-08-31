import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

// import { NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";

// const PUBLIC_FILE = /\.(.*)$/;
// const signInPage = "/auth/login";
// export async function middleware(req) {
//   const { pathname } = req.nextUrl;

//   if (
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/api") ||
//     PUBLIC_FILE.test(pathname)
//   ) {
//     return NextResponse.next();
//   }

//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

//   if (token && new Date(token?.expires) < Date.now()) {
//     const response = NextResponse.redirect(new URL(signInPage, req.url));

//     response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
//     response.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0 });

//     return response;
//   }

//   if (token && pathname === signInPage) {
//     return NextResponse.redirect(new URL("/", req.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

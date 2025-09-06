import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/layout/Header";
import AppSidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import AuthProvider from "@/components/AuthProvider";
import { redirect } from "next/navigation";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Neom ShareX Dashboard",
  description: " ",
};

export default async function RootLayout({ children }) {
  const currentLocale = await getLocale();
  // const session = await getServerSession(authOptions);
  // console.log({ session });

  // if (!session?.user) {
  //   redirect("/auth/signin");
  // }
  return (
    <NextIntlClientProvider>
      <html
        lang={currentLocale}
        dir={currentLocale == "ar" ? "rtl" : "ltr"}
        suppressHydrationWarning
        className="dark"
      >
        <body className={`${inter.className} antialiased`}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarProvider>
                <AppSidebar />
                <div className="w-full">
                  <Header />
                  <main className="p-6">{children}</main>
                  <Toaster position="top-center" richColors duration={1500} />
                </div>
              </SidebarProvider>
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </NextIntlClientProvider>
  );
}

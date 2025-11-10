import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/layout/Header";
import AppSidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getLocale } from "next-intl/server";

import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import SessionWrapper from "@/components/layout/SessionWrapper";
import "../globals.css";
import MainLayout from "@/components/layout/MainLayout";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Neom ShareX Dashboard",
  description: " ",
  icons: {
    icon: "/favico.png",
  },
};

export default async function RootLayout({ children }) {
  const currentLocale = await getLocale();

  return (
    <NextIntlClientProvider>
      <html
        lang={currentLocale}
        dir={currentLocale == "ar" ? "rtl" : "ltr"}
        suppressHydrationWarning
        className="dark"
      >
        <body className={`${inter.variable} antialiased`}>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SessionWrapper>
                <SidebarProvider>
                  <AppSidebar />
                  <div className="w-full">
                    <Header />
                    <MainLayout className="">{children}</MainLayout>
                  </div>
                </SidebarProvider>
                <Toaster position="top-center" richColors duration={1500} />
              </SessionWrapper>
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </NextIntlClientProvider>
  );
}

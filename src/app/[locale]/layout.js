import { Inter } from "next/font/google";
import { NextIntlClientProvider, useLocale } from "next-intl";

import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/layout/Header";
import AppSidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Neom ShareX Dashboard",
  description: " ",
};

export default function RootLayout({ children }) {
  const currentLocale = useLocale();
  return (
    <NextIntlClientProvider>
      <html
        lang={currentLocale}
        dir={currentLocale == "ar" ? "rtl" : "ltr"}
        suppressHydrationWarning
      >
        <body className={`${inter.className} antialiased`}>
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
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </NextIntlClientProvider>
  );
}

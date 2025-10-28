import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";

import { ThemeProvider } from "@/components/layout/ThemeProvider";

import { getLocale } from "next-intl/server";
import "../../globals.css";
import { Toaster } from "@/components/ui/sonner";

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
      >
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
          >
            <main className="  ">{children}</main>
            <Toaster position="top-center" richColors duration={1500} />
          </ThemeProvider>
        </body>
      </html>
    </NextIntlClientProvider>
  );
}

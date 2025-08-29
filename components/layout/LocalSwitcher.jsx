"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useMemo } from "react";
import { routing } from "@/src/i18n/routing";
import Image from "next/image";

const localeConfig = {
  en: {
    name: "English",
    flag: "/assets/flags/us.svg", // 🇺🇸 USA flag
    nativeName: "English",
  },
  ar: {
    name: "العربية",
    flag: "/assets/flags/sa.svg", // 🇸🇦 Saudi Arabia flag
    nativeName: "العربية",
  },
};
export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale = useMemo(
    () => pathname.split("/")[1] || routing.defaultLocale,
    [pathname]
  );

  const currentLocaleConfig = useMemo(
    () => localeConfig[currentLocale] || localeConfig[routing.defaultLocale],
    [currentLocale]
  );

  const handleLocaleChange = (newLocale) => {
    if (newLocale === currentLocale) return;

    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1  bg-transparent   shadow-none "
          aria-label="Change language"
        >
          {/* <span className="hidden sm:inline">{currentLocaleConfig.name}</span> */}
          <Image
            src={currentLocaleConfig.flag}
            alt="flag-lang-icon"
            width={25}
            height={25}
            className="rounded-md  "
          />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {routing.locales.map((locale) => {
          const config = localeConfig[locale];

          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className="flex items-center justify-between cursor-pointer  outline-0"
              aria-selected={currentLocale === locale}
            >
              <div className="flex items-center gap-2">
                <Image src={config.flag} alt="" width={20} height={20} />
                <span>{config.name}</span>
              </div>
              {currentLocale === locale && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

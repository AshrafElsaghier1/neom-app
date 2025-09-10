import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import { LocaleSwitcher } from "./LocalSwitcher";
import { ModeToggle } from "./DarkModeSwitcher";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur  transition-colors  duration-100 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-[#ffffffa1] supports-backdrop-blur:bg-white/95 dark:bg-[#171717] flex h-18 shrink-0 items-center gap-2 border-b px-4 ">
      <SidebarTrigger className="-ml-1  bg-main hover:bg-main text-white hover:text-white dark:bg-main dark:hover:bg-main cursor-pointer" />
      <Separator orientation="vertical" className="mr-2 h-4 " />
      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer outline-none focus-visible:ring-0 px-3">
            <figure className="flex items-center gap-2">
              <Image
                src="/assets/images/avatar.png"
                alt="avatar"
                width={50}
                height={50}
                className="rounded-full"
              />
              <figcaption className="text-sm font-medium">
                <DropdownMenuLabel>username </DropdownMenuLabel>
              </figcaption>
            </figure>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

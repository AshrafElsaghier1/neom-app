import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import SideBarItems from "./SideBarItems";

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className={"hover:bg-transparent   "}
            >
              <Link href="/" className="flex items-center w-full  h-[75px]">
                <Image
                  src="/assets/images/logo.png"
                  alt="Logo"
                  width={170}
                  height={60}
                  priority={true}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SideBarItems />

      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>  <LogoutButton />  </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
  );
}

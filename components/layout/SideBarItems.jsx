"use client";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../ui/sidebar";
import Link from "next/link";
import {
  BarChart3,
  Car,
  Wrench,
  CalendarDays,
  FileCheck2,
  TableProperties,
  FileText,
  Shield,
  Truck,
  Users,
  Users2,
  Building,
  ChevronRight,
  LineSquiggle,
  NotebookText,
  CarFront,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const SideBarItems = () => {
  const pathname = usePathname();
  const currentRoute = "/" + pathname.split("/").slice(2).join("/");
  // const t = useTranslations("sidebar");

  const [openItem, setOpenItem] = useState(null);

  const items = [
    { title: "Dashboard", url: "/", icon: BarChart3, exact: true },
    { title: "Bookings", url: "/bookings", icon: CalendarDays },
    { title: "Requests", url: "/requests", icon: TableProperties },
    { title: "Checklist", url: "/checklist", icon: FileCheck2 },
    { title: "Track", url: "/track", icon: LineSquiggle },
    {
      title: "Reports",
      url: "/reports",
      icon: NotebookText,
      children: [
        {
          title: "Driver Behaviour",
          url: "/reports/driver-behaviour",
          icon: FileText,
        },
        {
          title: "Safety Checklist",
          url: "/reports/safety-checklist",
          icon: Shield,
        },
        { title: "Utilization", url: "/reports/utilization", icon: BarChart3 },
        {
          title: "Checklist/Damage",
          url: "/reports/checklist-damage",
          icon: FileText,
        },
        {
          title: "Vehicle Status",
          url: "/reports/vehicle-status",
          icon: CarFront,
        },
        {
          title: "Service Maintenance",
          url: "/reports/service-maintenance",
          icon: Wrench,
        },
      ],
    },
    {
      title: "Vehicles",
      url: "/vehicles",
      icon: Car,
      children: [
        { title: "All vehicles", url: "/vehicles/all", icon: Car },
        { title: "Maintenance", url: "/vehicles/maintenance", icon: Wrench },
        {
          title: "Periodically Plans",
          url: "/vehicles/periodically-plans",
          icon: FileText,
        },
      ],
    },
    { title: "Stations", url: "/stations", icon: Truck },
    { title: "Users", url: "/users", icon: Users },
    { title: "Departments", url: "/departments", icon: Users2 },
    { title: "Sectors", url: "/sectors", icon: Building },
    { title: "Support", url: "/support", icon: Users2 },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.exact
              ? currentRoute === item.url
              : currentRoute.startsWith(item.url);

            // if (item.children) {
            //   return (
            //     <Collapsible
            //       key={item.title}
            //       open={openItem === item.title} // only this item opens
            //       onOpenChange={(isOpen) =>
            //         setOpenItem(isOpen ? item.title : null)
            //       }
            //     >
            //       <SidebarMenuItem>
            //         <CollapsibleTrigger
            //           asChild
            //           className="data-[state=open]:[&>.chevron]:rotate-90"
            //         >
            //           <SidebarMenuButton
            //             className="font-medium"
            //             isActive={isActive}
            //           >
            //             <item.icon
            //               className={isActive ? "text-white" : "text-main"}
            //               size={20}
            //             />
            //             <span className="font-medium">{item.title}</span>
            //             <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 chevron" />
            //           </SidebarMenuButton>
            //         </CollapsibleTrigger>
            //         <CollapsibleContent>
            //           <SidebarMenuSub>
            //             {item.children.map((child) => {
            //               const isChildActive = currentRoute === child.url;
            //               return (
            //                 <SidebarMenuSubItem key={child.title}>
            //                   <SidebarMenuSubButton
            //                     asChild
            //                     isActive={isChildActive}
            //                   >
            //                     <Link href={child.url}>
            //                       <child.icon size={16} />
            //                       <span className="font-medium">
            //                         {child.title}
            //                       </span>
            //                     </Link>
            //                   </SidebarMenuSubButton>
            //                 </SidebarMenuSubItem>
            //               );
            //             })}
            //           </SidebarMenuSub>
            //         </CollapsibleContent>
            //       </SidebarMenuItem>
            //     </Collapsible>
            //   );
            // }

            return (
              <SidebarMenuItem key={item.title} className="mt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      className="text-secondary"
                      isActive={isActive}
                    >
                      <Link href={item.url}>
                        <item.icon
                          className={isActive ? "text-white" : "text-main"}
                        />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SideBarItems;

"use client";

import { usePathname, useRouter } from "next/navigation";

const MainLayout = ({ children }) => {
  const pathname = usePathname();

  return (
    <main className={`${pathname.split("/")[2] === "track" ? "" : "p-6"} `}>
      {children}
    </main>
  );
};

export default MainLayout;

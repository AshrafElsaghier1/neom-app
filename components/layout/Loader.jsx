"use client";

import { useSession } from "next-auth/react";
import { Progress } from "../ui/progress";
import { useEffect, useState } from "react";
import Image from "next/image";

const Loader = () => {
  const { status } = useSession();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === "loading") {
      setProgress(20);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);
      return () => clearInterval(interval);
    } else if (status === "authenticated" || status === "unauthenticated") {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
      <Image
        src={"/assets/images/loading-logo.png"}
        alt="NEOM Logo"
        width={300}
        height={235}
        className="object-contain"
        priority
        draggable={false}
      />
      <Progress value={progress} className="w-64" />
    </div>
  );
};

export default Loader;

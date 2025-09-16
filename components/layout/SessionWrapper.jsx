"use client";

import { useSession } from "next-auth/react";

import Loader from "./Loader";

export default function SessionWrapper({ children }) {
  const { status } = useSession();

  if (status === "loading") {
    return <Loader />;
  }

  return <>{children}</>;
}

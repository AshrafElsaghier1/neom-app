"use client";
import { SessionProvider } from "next-auth/react"; // Import SessionProvider

const AuthProvider = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default AuthProvider;

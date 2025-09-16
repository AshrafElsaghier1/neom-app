"use client";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";

const LogoutButton = () => {
  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/auth/signin",
    });
  };
  const t = useTranslations("loginPage");
  return (
    <Button variant={"transparent"} onClick={handleLogout} className="text-lg">
      <LogOutIcon className="mr-1 text-main" />
      <span className="text-primary">{t("Logout_key")}</span>
    </Button>
  );
};

export default LogoutButton;

"use client";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import LoginForm from "../_component/LoginForm";

export default function LoginPage() {
  return (
    <div className="  flex gap-4 p-6 min-h-screen  mx-auto items-center  max-w-[1440px] ">
      <div className="w-full md:w-1/2 flex   justify-center  relative">
        <Card className="w-full  bg-transparent border-0 shadow-none px-8 lg:px-18">
          <CardContent className=" ">
            <div className="text-center mb-8">
              <Image
                src="/assets/images/logo.png"
                alt="NEOM Lumi"
                width={350}
                height={150}
                className="  mx-auto  "
                draggable="false"
              />
            </div>
            <div className="">
              <LoginForm />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-1/2 hidden md:flex h-[calc(100vh-48px)] items-center justify-center bg-[url('/assets/images/login-bg.png')] bg-cover bg-center  rounded-2xl bg-no-repeat "></div>
    </div>
  );
}

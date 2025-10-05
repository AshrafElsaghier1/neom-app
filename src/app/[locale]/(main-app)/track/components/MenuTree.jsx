import { Logs, X } from "lucide-react";
import { useLocale } from "next-intl";
import React from "react";

const MenuTree = ({ isMenuOpen, setIsMenuOpen }) => {
  const locale = useLocale();
  const isRTL = locale === "ar";
  return (
    <>
      <aside
        className={`fixed right-0 top-[72px] h-[calc(100vh-72px)] w-[315px] z-6 
          bg-sidebar border-l border-sidebar-border shadow-xl transform 
          transition-transform duration-300 ease-in-out
          ${
            isMenuOpen
              ? "translate-x-0"
              : isRTL
              ? "-translate-x-full"
              : "translate-x-full"
          }`}
      ></aside>

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={` cursor-pointer fixed top-20 z-6 p-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg 
          ${
            isMenuOpen
              ? "bg-[#343838] text-white right-[314px] rounded-r-none"
              : "bg-main text-white right-4"
          }
        `}
      >
        {isMenuOpen ? <X strokeWidth={0.9} size={20} /> : <Logs size={20} />}
      </button>
    </>
  );
};

export default MenuTree;

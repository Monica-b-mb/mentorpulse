// SidebarProvider.jsx — component-only file (component export)
import React, { useState, useEffect } from "react";
import SidebarContext from "./SidebarContext";

export default function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const v = localStorage.getItem("mp_sidebar_open");
      return v == null ? true : v === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mp_sidebar_open", isOpen);
    } catch {/*ex*/}
    document.documentElement.style.setProperty(
      "--mp-sidebar-width",
      isOpen ? "250px" : "80px"
    );
  }, [isOpen]);

  const toggle = () => setIsOpen((s) => !s);
  const setOpen = (val) => setIsOpen(val);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Rutas donde no se debe mostrar el Sidebar
  const hiddenSidebarRoutes = [];
  const hideSidebar = hiddenSidebarRoutes.includes(pathname);

  return (
    <div className="flex min-h-screen">
      {/* Solo mostrar botón si el sidebar está habilitado */}
      {!hideSidebar && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 bg-gray-700 text-white p-2 rounded-lg md:hidden"
        >
          <FiMenu size={20} />
        </button>
      )}

      {/* Mostrar Sidebar si no está en login/register */}
      

      <main
        className={`flex-1 p-8 transition-all duration-300 ease-in-out ${
          !hideSidebar && isOpen ? "ml-64" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}

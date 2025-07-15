"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiPieChart,
  FiMenu,
  FiX
} from "react-icons/fi";
import { useState } from "react";
import clsx from "clsx";

export default function Sidebar({ isOpen, setIsOpen }) {
  const [openStats, setOpenStats] = useState(false);

  const navItems = [
    { href: "/graficas", icon: <FiHome size={20} />, label: "Inicio" },
    { href: "/graficas/perfil", icon: <FiUser size={20} />, label: "Perfil" },
    { href: "/graficas/configuracion", icon: <FiSettings size={20} />, label: "Configuración" },
  ];

  return (
    <>
      {/* Botón para abrir sidebar (siempre visible en todas las pantallas) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 bg-gray-700 text-white p-2 rounded-lg"
      >
        <FiMenu size={20} />
      </button>

      {/* Overlay (click para cerrar) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-trasparent bg-opacity-40 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar como drawer */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 w-64 bg-gradient-to-bl from-[#d6d9e0] via-[#eeeef1] to-[#fbfbfc] shadow-lg border-r border-gray-200 flex flex-col z-50 transition-transform duration-300",
          {
            "-translate-x-full": !isOpen,
            "translate-x-0": isOpen
          }
        )}
      >
        {/* Encabezado */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">PQRS Analytics</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Menú */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-gray-500"
                  : "text-gray-800 hover:bg-gray-500 hover:text-gray-200"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Submenú estadísticas */}
          <div>
            <button
              onClick={() => setOpenStats(!openStats)}
              className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${
                pathname.startsWith("/graficas/estadisticas")
                  ? "bg-gray-500 text-white"
                  : "text-gray-800 hover:bg-gray-500 hover:text-gray-200"
              }`}
            >
              <span className="flex items-center space-x-3">
                <FiBarChart2 size={20} />
                <span className="font-medium">Estadísticas</span>
              </span>
              <FiChevronDown
                size={16}
                className={`transition-transform ${openStats ? "rotate-180" : ""}`}
              />
            </button>

            {openStats && (
              <div className="ml-8 mt-2 space-y-1 text-sm">
                {[
                  {
                    href: "/graficas/estadisticas/grafica-estados",
                    label: "Gráfica de estados por mes",
                  },
                  {
                    href: "/graficas/estadisticas/grafica-oportunidades-dia",
                    label: "Gráfica de oportunidades por día",
                  },
                  {
                    href: "/graficas/estadisticas/grafica-temas-mes",
                    label: "Gráfica de temas por mes",
                  },
                  {
                    href: "/graficas/estadisticas/grafica-cantidad-tema-estado",
                    label: "Gráfica - Cantidad por tema y estado",
                  },
                  {
                    href: "/graficas/estadisticas/grafica-ingresos-dia-mes",
                    label: "Gráfica Ingresos del día por mes",
                  },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                      pathname === href
                        ? "bg-gray-400 text-white"
                        : "text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <FiPieChart size={16} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/graficas";
            }}
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-200 bg-gray-700 hover:bg-gray-600 w-full transition-colors"
          >
            <FiLogOut size={20} />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

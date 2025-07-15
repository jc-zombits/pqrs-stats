// src/app/layout.js
import "./globals.css";

export const metadata = {
  title: "PQRS Dashboard",
  description: "Panel de control de estadísticas PQRS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="font-sans bg-gray-50">
          {/* Aquí dejamos que los children manejen la lógica del cliente */}
          {children}
      </body>
    </html>
  );
}

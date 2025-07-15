"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Space } from "antd";
import Image from "next/image";
import {
  RocketOutlined,
  HomeOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

export default function NotFound() {
  const router = useRouter();

  const handleDashboardRedirect = () => {
      router.replace("/graficas");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Fondo de video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
      >
        <source
          src="https://cdn.dribbble.com/userupload/32577068/file/original-2866f753e7069bd0fbbca4ed89147681.mp4"
          type="video/mp4"
        />
        Tu navegador no soporta el video.
      </video>

      <motion.div
        className="w-full max-w-4xl bg-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="grid md:grid-cols-2 gap-0">
          <div className="hidden md:flex items-center justify-center p-8">
            <Image
              src="/images/not-found.avif"
              alt="Página no encontrada"
              width={500}
              height={400}
              className="object-contain max-h-[400px] rounded-[5px]"
            />
          </div>

          <div className="flex flex-col justify-center items-center p-8 text-center">
            <div className="mb-6">
              <Image
                  src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/themes/theme_alcaldia/logos/logo_footer.png"
                  alt="Logo Alcaldía"
                  width={150}
                  height={100}
                  style={{
                    margin: '0 auto',
                    display: 'block'
                  }}
              />
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Página no encontrada
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>

            <Space direction="vertical" size="middle" className="w-full">
              <Button
                type="dashed"
                size="large"
                icon={<DashboardOutlined />}
                onClick={handleDashboardRedirect}
                className="h-12 px-8 text-blue-500 hover:text-blue-600 hover:border-blue-500 transition-all"
                style={{
                  borderRadius: "8px",
                }}
              >
                Ir al Dashboard
              </Button>

              <Button
                type="default"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => router.push("/contact")}
                className="h-12 px-8 border-blue-500 text-blue-600 hover:text-blue-700"
                style={{
                  borderRadius: "8px",
                }}
              >
                Contactar Soporte
              </Button>
            </Space>
          </div>
        </div>

        <div className="bg-gray-50 bg-opacity-70 p-4 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Tu Empresa - Todos los derechos
            reservados
          </p>
        </div>
      </motion.div>
    </div>
  );
}

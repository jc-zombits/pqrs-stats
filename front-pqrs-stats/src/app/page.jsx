"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/graficas"); // redirecciona automáticamente a graficas
  }, [router]);

  return null; // no muestra nada mientras redirige
}

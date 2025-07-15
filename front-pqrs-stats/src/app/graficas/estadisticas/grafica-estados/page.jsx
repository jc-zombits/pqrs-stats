import GraficaEstados from "@/app/components/GraficaEstados";

export default function GraficaEstadosPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Estadísticas - Estados por Mes
      </h1>
      <section id="grafica-estados" className="scroll-mt-24">
        <GraficaEstados />
      </section>
    </div>
  );
}

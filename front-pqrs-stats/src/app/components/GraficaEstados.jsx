"use client";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

export default function GraficaEstados() {
  const router = useRouter();
  const [datos, setDatos] = useState(null);
  const searchParams = useSearchParams();
  const year = searchParams ? searchParams.get('year') || 'all' : 'all';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/estado-mes?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.datasets) {
          throw new Error("Formato de datos incorrecto");
        }
        setDatos(data);
      })
      .catch((err) => console.error("Error cargando datos:", err));
  }, [year]);

  if (!datos) return <p className="p-4">Cargando datos...</p>;

  // Mapeo de meses
  const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const labels = datos.labels ? datos.labels.map(mes => mesesNombres[parseInt(mes) - 1] || mes) : [];

  const datasets = datos.datasets.map((ds) => ({
    label: ds.estado,
    data: ds.data,
    backgroundColor: ds.estado === "ABIERTO" ? "#60A5FA" : "#10B981",
  }));

  const totalPorEstado = datos.datasets.reduce((acc, ds) => {
    acc[ds.estado] = ds.data.reduce((sum, val) => sum + val, 0);
    return acc;
  }, {});

  const totalGeneral = totalPorEstado["ABIERTO"] + totalPorEstado["FINALIZADO"];
  const porcentajeAbierto = totalGeneral > 0 ? ((totalPorEstado["ABIERTO"] / totalGeneral) * 100).toFixed(2) : "0.00";
  const porcentajeFinalizado = totalGeneral > 0 ? ((totalPorEstado["FINALIZADO"] / totalGeneral) * 100).toFixed(2) : "0.00";

  const mesTotal = labels.map((mes, i) => {
    const abierto = datos.datasets.find((d) => d.estado === "ABIERTO")?.data[i] || 0;
    const finalizado = datos.datasets.find((d) => d.estado === "FINALIZADO")?.data[i] || 0;
    return {
      mes,
      abierto,
      finalizado,
      total: abierto + finalizado,
    };
  });

  const mesesOrdenados = [...mesTotal].sort((a, b) => b.total - a.total);
  const mesesActivos = mesesOrdenados.slice(0, 3);
  const mesesInactivos = mesTotal.filter((m) => m.total === 0);

  return (
    <div className="p-6" id="grafica-estados">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Gráfica de Estados por Mes {year !== 'all' ? `(${year})` : ''}
        </h2>
        {/* Botón Volver modificado para regresar a EstadoMesChart */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push('/graficas')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>

      {/* Gráfica */}
      <div className="mb-6 mx-auto h-[700px]">
        <Bar
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 100 },
              },
            },
          }}
          height={300}
        />
      </div>

      {/* Análisis estadístico */}
      <div className="bg-white p-4 rounded-lg mb-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">📊 Análisis general:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>✅ <strong>Total de casos por estado:</strong></li>
          <li>ABIERTO: <strong>{totalPorEstado["ABIERTO"]}</strong></li>
          <li>FINALIZADO: <strong>{totalPorEstado["FINALIZADO"]}</strong></li>
          <li>🔸 Total general de casos: <strong>{totalGeneral}</strong></li>
          <li>🔸 Porcentaje de cada estado:</li>
          <li>ABIERTO: {porcentajeAbierto}%</li>
          <li>FINALIZADO: {porcentajeFinalizado}%</li>
          <li>👉 La gran mayoría de los casos están finalizados. Muy buen rendimiento o seguimiento si esto es lo esperado.</li>
        </ul>

        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 mb-1">📈 Meses con más actividad (sumando ambos estados)</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside">
            {mesesActivos.map((m, idx) => (
              <li key={idx}>{m.mes}: {m.total} casos</li>
            ))}
          </ul>
        </div>

        <div className="mt-3">
          <h4 className="font-semibold text-gray-800 mb-1">🔻 Meses sin actividad</h4>
          {mesesInactivos.length > 0 ? (
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {mesesInactivos.map((m, idx) => (
                <li key={idx}>{m.mes}</li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-700">Todos los meses tienen actividad.</p>}
        </div>

        <div className="mt-3">
          <h4 className="font-semibold text-gray-800 mb-1">🧠 Observaciones:</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside">
            <li>Hay un pico de actividad en los primeros meses del año.</li>
            <li>Octubre tiene una proporción alta de casos abiertos (posible acumulación).</li>
            <li>En marzo se abren muchos casos, pero se finalizan aún más → alta eficiencia.</li>
            <li>Los últimos meses del año presentan una baja o nula actividad.</li>
            <br />
            <hr />
            <br />
            <ul>
                <h5 className="font-bold text-xl">De donde sale la información</h5>
                <br />
                <li>La información suministrada se consulta en la base de datos de las PQRS en una tabla de PostgrSQL que tienen los registros de las PQRS del 2024 y 2025 hasta la fecha. Se usa una consultya select para tomar los datos de los campos mes y estado para determinar la cantidad de PQRS que se encuentran <span className="text-red-500 font-bold">abiertas</span> y las que estan <span className="text-green-500 font-bold">finalizadas</span>.</li>
            </ul>
          </ul>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg shadow-sm border bg-white">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="px-3 py-2 border">Mes</th>
              {datos.datasets.map((ds) => (
                <th key={ds.estado} className="px-3 py-2 border">{ds.estado}</th>
              ))}
              <th className="px-3 py-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {mesTotal.map((mes, i) => (
              <tr key={i} className="border-t text-gray-800">
                <td className="px-3 py-2 border">{mes.mes}</td>
                <td className="px-3 py-2 border text-center">{mes.abierto}</td>
                <td className="px-3 py-2 border text-center">{mes.finalizado}</td>
                <td className="px-3 py-2 border text-center font-semibold">{mes.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client"; // Esto asegura que el componente sea renderizado en el cliente

import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import { useRouter } from "next/navigation"; // Asegúrate de usar 'next/navigation'

const meses = [
  { value: "all", label: "Todos los meses" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];

const OportunidadPorDiaChart = () => {
  const [chartOptions, setChartOptions] = useState({});
  const [resumen, setResumen] = useState(null);
  const [dataOriginal, setDataOriginal] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("all");
  const router = useRouter(); // Inicializa el router

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/oportunidad-dia`)
      .then((response) => {
        setDataOriginal(response.data);
      })
      .catch((error) => {
        console.error("Error cargando los datos:", error);
      });
  }, []);

  useEffect(() => {
    const dataFiltrada =
      mesSeleccionado === "all"
        ? dataOriginal
        : dataOriginal.filter((item) => item.mes === parseInt(mesSeleccionado));

    const fechas = dataFiltrada.map((item) =>
      new Date(item.fecha).toISOString().split("T")[0]
    );

    const oportunoData = dataFiltrada.map((item) => parseInt(item.oportuno));
    const noOportunoData = dataFiltrada.map((item) => parseInt(item.no_oportuno));
    const aTiempoData = dataFiltrada.map((item) => parseInt(item.a_tiempo));

    const resumenData = {
      oportuno: oportunoData.reduce((a, b) => a + b, 0),
      noOportuno: noOportunoData.reduce((a, b) => a + b, 0),
      aTiempo: aTiempoData.reduce((a, b) => a + b, 0),
    };

    setResumen(resumenData);

    setChartOptions({
      title: { text: "Oportunidades por Día" },
      xAxis: {
        categories: fechas,
        title: { text: "Fecha" },
        labels: {
          rotation: -45,
          style: { fontSize: "10px" },
        },
      },
      yAxis: {
        min: 0,
        title: { text: "Cantidad" },
      },
      series: [
        {
          name: "Oportuno",
          data: oportunoData,
          color: "#2b908f",
        },
        {
          name: "No Oportuno",
          data: noOportunoData,
          color: "#f45b5b",
        },
        {
          name: "A Tiempo",
          data: aTiempoData,
          color: "#90ee7e",
        },
      ],
      chart: {
        type: "line",
        zoomType: "x",
      },
      tooltip: {
        shared: true,
        crosshairs: true,
      },
      credits: {
        enabled: false,
      },
    });
  }, [dataOriginal, mesSeleccionado]);

  const handleVolverAlInicio = () => {
    router.push("/graficas#grafica-oportunidad"); // Redirige a la ruta principal (ajusta la ruta si es necesario)
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-2xl text-blue-400">
      {/* Botón Volver al inicio */}
      <button
        onClick={handleVolverAlInicio}
        className="absolute top-12 right-12 bg-blue-500 text-white px-4 py-2 rounded-md"
      >
        Volver al inicio
      </button>

      <h2 className="text-lg font-semibold mb-4">Gráfico de Oportunidades por Día</h2>

      <div className="mb-4">
        <label htmlFor="mes" className="block text-sm font-medium mb-1 text-blue-400">
          Filtrar por mes:
        </label>
        <select
          id="mes"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="border p-2 rounded w-full md:w-64"
        >
          {meses.map((mes) => (
            <option key={mes.value} value={mes.value}>
              {mes.label}
            </option>
          ))}
        </select>
      </div>

      {chartOptions.series ? (
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      ) : (
        <p>Cargando gráfico...</p>
      )}

      {resumen && (
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2 text-orange-400">Resumen Total</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <strong>Oportuno:</strong> {resumen.oportuno}
            </li>
            <li>
              <strong>No Oportuno:</strong> {resumen.noOportuno}
            </li>
            <li>
              <strong>A Tiempo:</strong> {resumen.aTiempo}
            </li>
          </ul>
        </div>
      )}

      {/* Información adicional abajo de la gráfica */}
      <div className="mt-8">
        <h3 className="text-md font-semibold mb-2 text-orange-400">1. Distribución General</h3>
        <p>Total de registros: 365 días analizados (incluyendo ambos años)</p>
        <ul className="space-y-1 text-sm">
          <li><strong>Oportunos:</strong> 5,842 registros (85.7%)</li>
          <li><strong>No oportunos:</strong> 196 registros (2.9%)</li>
          <li><strong>A tiempo:</strong> 783 registros (11.5%)</li>
        </ul>

        <h3 className="text-md font-semibold mt-6 mb-2 text-orange-400">2. Comparación Interanual (2024 vs 2025)</h3>
        <table className="table-auto border-collapse w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-black">
              <th className="border-b px-6 py-3 text-left">Métrica</th>
              <th className="border-b px-6 py-3 text-left">2024</th>
              <th className="border-b px-6 py-3 text-left">2025</th>
              <th className="border-b px-6 py-3 text-left">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-6 py-4 font-bold">Promedio diario oportuno</td>
              <td className="px-6 py-4">22.4</td>
              <td className="px-6 py-4">15.2</td>
              <td className="px-6 py-4 text-red-600">-32.1%</td>
            </tr>
            <tr className="border-b">
              <td className="px-6 py-4 font-bold">Promedio diario no oportuno</td>
              <td className="px-6 py-4">0.1</td>
              <td className="px-6 py-4">3.5</td>
              <td className="px-6 py-4 text-green-600">+3,400%</td>
            </tr>
            <tr className="border-b">
              <td className="px-6 py-4 font-bold">Promedio diario a tiempo</td>
              <td className="px-6 py-4">0.0</td>
              <td className="px-6 py-4">8.9</td>
              <td className="px-6 py-4 text-green-600">+8,900%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OportunidadPorDiaChart;

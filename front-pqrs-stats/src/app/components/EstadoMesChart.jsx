"use client";
import React, { useEffect, useState, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import Link from "next/link";

const EstadoMesChart = () => {
  const [originalData, setOriginalData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedEstados, setSelectedEstados] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const chartComponentRef = useRef(null);

  const meses = [
    { value: null, label: "Todos los meses", short: "Todos" },
    { value: 1, label: "Enero", short: "Ene" },
    { value: 2, label: "Febrero", short: "Feb" },
    { value: 3, label: "Marzo", short: "Mar" },
    { value: 4, label: "Abril", short: "Abr" },
    { value: 5, label: "Mayo", short: "May" },
    { value: 6, label: "Junio", short: "Jun" },
    { value: 7, label: "Julio", short: "Jul" },
    { value: 8, label: "Agosto", short: "Ago" },
    { value: 9, label: "Septiembre", short: "Sep" },
    { value: 10, label: "Octubre", short: "Oct" },
    { value: 11, label: "Noviembre", short: "Nov" },
    { value: 12, label: "Diciembre", short: "Dic" }
  ];

  const availableYears = [2024, 2025];

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/estado-mes?year=${selectedYear}`
        );
        
        console.log(`Datos para ${selectedYear}:`, res.data);
        
        setOriginalData(res.data);
        setSelectedEstados(res.data.datasets.map(d => d.estado));
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // Filtrar datos cuando cambia el mes seleccionado o los datos originales
  useEffect(() => {
    if (!originalData) return;

    if (!selectedMonth) {
      setFilteredData(originalData);
    } else {
      const monthIndex = selectedMonth - 1;
      setFilteredData({
        labels: [selectedMonth.toString()],
        datasets: originalData.datasets.map(dataset => ({
          estado: dataset.estado,
          data: [dataset.data[monthIndex] || 0]
        }))
      });
    }
  }, [originalData, selectedMonth]);

  // Actualizar gráfico cuando cambian los datos filtrados
  useEffect(() => {
    if (chartComponentRef.current && filteredData) {
      chartComponentRef.current.chart.update({
        series: getSeriesData(),
        xAxis: {
          categories: getMesesMostrar()
        },
        title: {
          text: getChartTitle()
        }
      }, true);
    }
  }, [filteredData, selectedEstados]);

  const getMesesMostrar = () => {
    if (!filteredData) return [];
    
    return filteredData.labels.map(m => {
      const mes = meses.find(ms => ms.value === parseInt(m));
      return mes ? mes.short : m;
    });
  };

  const getSeriesData = () => {
    if (!filteredData) return [];
    
    return selectedEstados.map((estadoSel) => {
      const dataset = filteredData.datasets.find(ds => ds.estado === estadoSel);
      return {
        name: estadoSel,
        data: dataset ? [...dataset.data] : [],
        color: estadoSel === "ABIERTO" ? "#FFA500" : "#4682B4"
      };
    });
  };

  const getResumenData = () => {
    if (!filteredData) return [];
    
    return selectedEstados.map((estadoSel) => {
      const dataset = filteredData.datasets.find(ds => ds.estado === estadoSel);
      const total = dataset ? dataset.data.reduce((sum, val) => sum + val, 0) : 0;
      return { estado: estadoSel, total };
    });
  };

  const getChartTitle = () => {
    const mesSeleccionado = meses.find(m => m.value === selectedMonth);
    return `Trámites por estado${mesSeleccionado ? ` - ${mesSeleccionado.label}` : ''} (${selectedYear})`;
  };

  const handleEstadoToggle = (estado) => {
    setSelectedEstados(prev =>
      prev.includes(estado)
        ? prev.filter(e => e !== estado)
        : [...prev, estado]
    );
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null); // Resetear mes al cambiar año
  };

  const options = {
    chart: {
      type: 'column'
    },
    title: {
      text: getChartTitle()
    },
    xAxis: {
      categories: getMesesMostrar(),
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: "Cantidad"
      },
      tickInterval: 150,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        animation: {
          duration: 1000
        }
      }
    },
    series: getSeriesData()
  };

  if (isLoading || !originalData || !filteredData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-2xl">
        <p className="text-center py-10">Cargando datos para {selectedYear}...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <h2 className="text-xl font-bold mb-4 text-blue-400">Gráfica de Estados por Mes</h2>

      {/* Selectores de año y mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="text-blue-600">
          <label className="mr-2 font-semibold">Seleccionar año:</label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={isLoading}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="text-blue-600">
          <label className="mr-2 font-semibold">Filtrar por mes:</label>
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
            className="border rounded px-2 py-1"
            disabled={isLoading}
          >
            {meses.map((mes) => (
              <option key={mes.value || 'all'} value={mes.value || ''}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="mb-4 text-orange-600">
        <span className="font-semibold mr-2 text-blue-400">Filtrar por estado:</span>
        {originalData.datasets.map(dataset => (
          <label key={dataset.estado} className="mr-4">
            <input
              type="checkbox"
              checked={selectedEstados.includes(dataset.estado)}
              onChange={() => handleEstadoToggle(dataset.estado)}
              className="mr-1"
              disabled={isLoading}
            />
            {dataset.estado}
          </label>
        ))}
      </div>

      <HighchartsReact 
        highcharts={Highcharts} 
        options={options} 
        ref={chartComponentRef}
      />

      {/* Resumen */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-600">Resumen:</h3>
        <ul className="list-disc ml-6 text-blue-400">
          {getResumenData().map((item) => (
            <li key={item.estado}>
              <span className="font-medium">{item.estado}:</span> {item.total} trámites{selectedMonth ? ` en ${meses.find(m => m.value === selectedMonth)?.label}` : ' en total'}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href={`/graficas/estadisticas/grafica-estados?year=${selectedYear}`}>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-md transition">
            Ver análisis completo →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default EstadoMesChart;
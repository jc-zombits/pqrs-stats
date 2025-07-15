"use client";
import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const meses = [
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
  { value: "12", label: "Diciembre" },
];

const TemasPorMesChart = () => {
  const [data, setData] = useState({});
  const [subsecretarias, setSubsecretarias] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("1");
  const [subsecretariaSeleccionada, setSubsecretariaSeleccionada] = useState("all");
  const [chartOptions, setChartOptions] = useState({});
  const [temaDetalle, setTemaDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estadisticasModal, setEstadisticasModal] = useState({
    loading: false,
    datos: [],
    error: null
  })

  // Cargar subsecretarías al montar el componente
  useEffect(() => {
    const fetchSubsecretarias = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/subsecretarias`
        );
        setSubsecretarias([
          { cod_subsecretaria: "all", subsecretaria: "Todas las subsecretarías" },
          ...response.data
        ]);
      } catch (error) {
        console.error("Error al cargar subsecretarías:", error);
      }
    };

    fetchSubsecretarias();
  }, []);

  // Cargar datos cuando cambia la subsecretaría seleccionada
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params = {};
        if (subsecretariaSeleccionada !== "all") {
          params.cod_subsecretaria = subsecretariaSeleccionada;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/tema-mes`,
          { params }
        );

        setData(response.data);
      } catch (error) {
        console.error("Error al cargar los datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [subsecretariaSeleccionada]);

  useEffect(() => {
    if (!data[mesSeleccionado]) return;
  
    const temas = data[mesSeleccionado].map((item) => item.tema);
    const cantidades = data[mesSeleccionado].map((item) => item.cantidad);
    
    const subsecretariaActual = subsecretarias.find(
      sub => sub.cod_subsecretaria === subsecretariaSeleccionada
    );

    setChartOptions({
      chart: {
        type: "bar"
      },
      title: {
        text: `Temas más frecuentes en ${meses.find(m => m.value === mesSeleccionado).label}${
          subsecretariaSeleccionada !== "all" ? ` - ${subsecretariaActual?.subsecretaria || ''}` : ""
        }`
      },
      xAxis: {
        categories: temas,
        title: {
          text: "Temas"
        },
        labels: {
          style: {
            fontSize: "10px"
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: "Cantidad"
        }
      },
      series: [
        {
          name: "Cantidad",
          data: cantidades,
          point: {
            events: {
              click: function () {
                const temaSeleccionado = temas[this.index];
                const detalles = data[mesSeleccionado].find(item => item.tema === temaSeleccionado);
                setTemaDetalle({ 
                  ...detalles, 
                  mes: mesSeleccionado,
                  subsecretaria: subsecretariaActual?.subsecretaria || 'Todas'
                });
              }
            }
          }
        }
      ],
      tooltip: {
        pointFormat: "<b>{point.y}</b> casos"
      },
      credits: {
        enabled: false
      }
    });
  }, [data, mesSeleccionado, subsecretariaSeleccionada, subsecretarias]);

   const cargarDatosModal = async (temaDetalle) => {
    setEstadisticasModal(prev => ({ ...prev, loading: true }));
    try {
      const params = {
        tema: temaDetalle.tema,
        mes: temaDetalle.mes,
        anio: new Date().getFullYear(), // o puedes pasarlo como prop
        subsecretaria: temaDetalle.cod_subsecretaria || subsecretariaSeleccionada
      };

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/modal-detalle`,
        { params }
      );

      setEstadisticasModal({
        loading: false,
        datos: response.data,
        error: null
      });
    } catch (error) {
      setEstadisticasModal({
        loading: false,
        datos: [],
        error: "Error al cargar los datos del modal"
      });
      console.error("Error al cargar datos del modal:", error);
    }
  };

  // Modificamos el useEffect que maneja el temaDetalle
  useEffect(() => {
    if (temaDetalle) {
      cargarDatosModal(temaDetalle);
    }
  }, [temaDetalle]);

  // Configuración de la gráfica para el modal
  const configGraficaModal = {
    labels: ['ABIERTO', 'FINALIZADO'], // Fuerza ambos estados
    datasets: [{
      label: 'Cantidad por Estado',
      data: ['ABIERTO', 'FINALIZADO'].map(estado => {
        const dato = estadisticasModal.datos.find(d => d.estado === estado);
        return dato ? dato.cantidad : 0;
      }),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)', // Rojo para ABIERTO
        'rgba(75, 192, 192, 0.7)'  // Verde para FINALIZADO
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  };

  const opcionesGraficaModal = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
        },
        datalabels: {
          color: '#000',
          anchor: 'end',
          align: 'top',
          formatter: (value) => {
            return value > 0 ? value : '';
          }
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1
        }
      }
    }
  };


  return (
    <div className="mt-6 p-4 border rounded-lg shadow bg-white text-blue-600 font-bold">
      <h2 className="text-lg font-extrabold mb-4">Gráfico de Temas por Mes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="mes" className="block text-sm font-medium mb-1">Seleccionar mes:</label>
          <select
            id="mes"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="border p-2 rounded w-full"
          >
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>{mes.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subsecretaria" className="block text-sm font-medium mb-1">
            Filtrar por subsecretaría:
          </label>
          <select
            id="subsecretaria"
            value={subsecretariaSeleccionada}
            onChange={(e) => setSubsecretariaSeleccionada(e.target.value)}
            className="border p-2 rounded w-full"
            disabled={isLoading}
          >
            {subsecretarias.map((sub) => (
              <option key={sub.cod_subsecretaria} value={sub.cod_subsecretaria}>
                {sub.subsecretaria}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Cargando datos...</p>
      ) : chartOptions.series ? (
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      ) : (
        <p>No hay datos disponibles para los filtros seleccionados</p>
      )}
      
      {/* Modal para resumen de datos*/}
      {temaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
              onClick={() => {
                setTemaDetalle(null);
                setEstadisticasModal({ loading: false, datos: [], error: null });
              }}
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold mb-4">Detalle del Tema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p><strong>Mes:</strong> {meses.find(m => m.value === temaDetalle.mes)?.label}</p>
                <p><strong>Subsecretaría:</strong> {temaDetalle.subsecretaria}</p>
              </div>
              <div>
                <p><strong>Tema:</strong> {temaDetalle.tema}</p>
                <p><strong>Cantidad Total:</strong> {temaDetalle.cantidad}</p>
              </div>
            </div>
            
            <div className="h-64 mb-4 border rounded p-2">
              {estadisticasModal.loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : estadisticasModal.error ? (
                <div className="h-full flex items-center justify-center text-red-500">
                  {estadisticasModal.error}
                </div>
              ) : estadisticasModal.datos.length > 0 ? (
                <Bar data={configGraficaModal} options={opcionesGraficaModal} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de estados disponibles
                </div>
              )}
            </div>
            
            <button
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                setTemaDetalle(null);
                setEstadisticasModal({ loading: false, datos: [], error: null });
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemasPorMesChart;
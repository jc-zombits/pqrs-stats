"use client";
import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";

const IngresosTotalMes = () => {
  const [chartOptions, setChartOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/ingresos-dia-mes`);
        const data = response.data;

        // Agrupar datos por mes
        const meses = [...new Set(data.map(item => item.mes))];
        const series = meses.map(mes => {
          const datosMes = data.filter(item => item.mes === mes);
          
          return {
            name: `Mes ${mes}`,
            data: datosMes.map(item => ({
              x: new Date(item.fecha_de_ingreso).getTime(),
              y: parseInt(item.cantidad),
              fecha: item.fecha_de_ingreso
            })),
            type: 'line',
            marker: {
              enabled: true
            }
          };
        });

        setChartOptions({
          chart: {
            type: 'line',
            height: '500px',
            spacingTop: 40,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          },
          title: {
            text: 'Ingresos por Día Agrupados por Mes',
            align: 'center',
            style: {
              marginTop: '20px',
              paddingBottom: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333333'
            },
            margin: 30
          },
          xAxis: {
            type: 'datetime',
            title: {
              text: 'Fecha'
            },
            labels: {
              formatter: function() {
                return Highcharts.dateFormat('%e %b', this.value);
              }
            },
            crosshair: true
          },
          yAxis: {
            title: {
              text: 'Cantidad de Ingresos'
            },
            min: 0
          },
          tooltip: {
            shared: true,
            useHTML: true,
            formatter: function() {
              let tooltip = `<small>${Highcharts.dateFormat('%A, %e %B %Y', this.x)}</small><table>`;
              
              this.points.forEach(point => {
                tooltip += `
                  <tr>
                    <td style="color:${point.color}">●</td>
                    <td>${point.series.name}:</td>
                    <td style="text-align: right"><b>${point.y}</b></td>
                  </tr>
                `;
              });
              
              tooltip += '</table>';
              return tooltip;
            }
          },
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'top',
            itemStyle: {
              fontWeight: 'normal'
            }
          },
          plotOptions: {
            series: {
              pointStart: 1,
              label: {
                connectorAllowed: false
              },
              pointInterval: 24 * 3600 * 1000, // 1 día
              marker: {
                radius: 4,
                symbol: 'circle'
              }
            }
          },
          series: series,
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
          credits: {
            enabled: false
          },
          responsive: {
            rules: [{
              condition: {
                maxWidth: 600
              },
              chartOptions: {
                legend: {
                  layout: 'horizontal',
                  align: 'center',
                  verticalAlign: 'top'
                }
              }
            }]
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar los datos:", err);
        setError("Error al cargar los datos. Por favor intenta nuevamente.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg shadow-2xl p-4" style={{ 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 className="text-lg font-semibold mb-4 text-blue-400">Tendencia de Ingresos Diarios</h2>
        
        {error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Cargando gráfico...</p>
          </div>
        ) : (
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{
              style: {
                width: '100%',
                height: '100%',
                minHeight: '500px',
                borderRadius: '8px',
                overflow: 'hidden'
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default IngresosTotalMes;
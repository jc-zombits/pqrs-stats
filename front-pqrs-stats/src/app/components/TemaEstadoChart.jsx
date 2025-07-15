"use client";
import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import axios from "axios";

const TemaEstadoChart = () => {
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/tema-estado`)
      .then((response) => {
        const data = response.data;

        const temas = [...new Set(data.map((item) => item.tema))];
        const estados = [...new Set(data.map((item) => item.estado))];

        const series = estados.map((estado) => ({
          name: estado,
          data: temas.map((tema) => {
            const registro = data.find(
              (item) => item.tema === tema && item.estado === estado
            );
            return {
              y: registro ? parseInt(registro.cantidad) : 0,
              name: tema // Añadimos el nombre del tema a cada punto
            };
          }),
        }));

        setChartOptions({
          chart: {
            type: 'bar',
            height: temas.length * 40 + 150, // Ajuste de altura dinámico
            spacingTop: 30
          },
          title: {
            text: 'Cantidad por Tema y Estado',
            align: 'center',
          },
          xAxis: {
            categories: temas,
            title: {
              text: 'Temas'
            },
            labels: {
              style: {
                fontSize: '12px',
                width: '300px',
                textOverflow: 'ellipsis'
              },
              align: 'right',
              reserveSpace: true
            },
            scrollbar: {
              enabled: true
            }
          },
          yAxis: {
            min: 0,
            title: {
              text: 'Cantidad'
            },
            tickInterval: 500 // Ajusta según tus necesidades
          },
          legend: {
            reversed: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'top'
          },
          plotOptions: {
            bar: {
              dataLabels: {
                enabled: true,
                formatter: function() {
                  return this.y > 0 ? this.y : '';
                },
                style: {
                  fontSize: '11px',
                  textOutline: 'none'
                }
              },
              pointWidth: 15 // Ancho de las barras
            },
            series: {
              pointPadding: 0.1,
              groupPadding: 0.1
            }
          },
          tooltip: {
            formatter: function() {
              return `<b>${this.series.name}</b><br/>${this.point.name}: <b>${this.y}</b>`;
            }
          },
          series: series,
          credits: {
            enabled: false
          },
          responsive: {
            rules: [{
              condition: {
                maxWidth: 800
              },
              chartOptions: {
                chart: {
                  height: temas.length * 30 + 150
                },
                xAxis: {
                  labels: {
                    style: {
                      fontSize: '10px'
                    }
                  }
                }
              }
            }]
          }
        });
      })
      .catch((error) => {
        console.error("Error al cargar los datos:", error);
      });
  }, []);

  return (
    <div className="mt-4 overflow-x-auto shadow-2xl">
      <h2 className="text-xl font-semibold mb-4 p-6 text-blue-600">Cantidad por Tema y Estado - Ultimo Corte</h2>
      <div className="w-full overflow-hidden rounded-lg shadow-md" style={{ minHeight: '500px', borderRadius: '0.5rem' }}>
        {chartOptions.series ? (
          <HighchartsReact 
            highcharts={Highcharts} 
            options={chartOptions} 
            containerProps={{ style: { width: '100%', height: '100%' } }}
          />
        ) : (
          <p>Cargando gráfico...</p>
        )}
      </div>
    </div>
  );
};

export default TemaEstadoChart;
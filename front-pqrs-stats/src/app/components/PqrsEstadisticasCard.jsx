'use client'

import React, { useEffect, useState } from 'react';
import { Card, Select, Spin, Tag } from 'antd';
import axios from 'axios';

const { Option } = Select;

const PqrsEstadisticasCard = () => {
  const [subsecretarias, setSubsecretarias] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Colores y nombres de meses, igual que antes
  const temaColors = ['#FF7F50', '#87CEFA', '#DA70D6', '#32CD32', '#6495ED', '#FF69B4'];
  const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/estadisticas-subsecretarias`)
      .then(res => setSubsecretarias(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSub && selectedYear) {
      setLoading(true);
      axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/estadisticas-pqrs-por-mes-y-tema`, {
        params: { subsecretaria: selectedSub, anio: selectedYear }
      })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [selectedSub, selectedYear]);

  // Agrupar data por tema igual que antes
  const temas = Object.entries(
    data.reduce((acc, curr) => {
      if (!acc[curr.tema]) {
        acc[curr.tema] = { total: 0, detalles: [] };
      }
      acc[curr.tema].total += curr.cantidad;
      acc[curr.tema].detalles.push({ mes: curr.mes, cantidad: curr.cantidad });
      return acc;
    }, {})
  );

  // Opcional: rango de años para seleccionar (por ejemplo últimos 5 años)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card title="Estadísticas PQRS por Mes y Tema" style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Select
          style={{ width: 300 }}
          placeholder="Selecciona una subsecretaría"
          onChange={setSelectedSub}
          value={selectedSub}
        >
          {subsecretarias.map(s => (
            <Option key={s.subsecretaria} value={s.subsecretaria}>
              {s.subsecretaria}
            </Option>
          ))}
        </Select>

        <Select
          style={{ width: 120 }}
          placeholder="Año"
          onChange={setSelectedYear}
          value={selectedYear}
        >
          {years.map(y => (
            <Option key={y} value={y}>
              {y}
            </Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Spin />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {temas.map(([tema, info], index) => (
            <Card
              key={tema}
              size="small"
              style={{
                width: 260,
                borderTop: `4px solid ${temaColors[index % temaColors.length]}`,
              }}
              styles={{ padding: 12 }}
            >
              <h4 style={{ marginBottom: 8 }}>
                <Tag color={temaColors[index % temaColors.length]}>{tema}</Tag>
              </h4>
              <strong>Total:</strong> {info.detalles.reduce((acc, d) => acc + Number(d.cantidad), 0)}
              <div>
                {info.detalles.map(({ mes, cantidad }) => (
                  <p key={mes} style={{ margin: '2px 0' }}>
                    {monthNames[mes - 1] || `Mes ${mes}`}: {cantidad}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PqrsEstadisticasCard;

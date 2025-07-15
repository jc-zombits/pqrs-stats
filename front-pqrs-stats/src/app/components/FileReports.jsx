'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Select, Spin, message } from 'antd';
import { DownloadOutlined, ArrowLeftOutlined  } from '@ant-design/icons';
import axios from 'axios';

const FileReports = ({ searchParams }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subsecretaria, setSubsecretaria] = useState(searchParams?.cod_subsecretaria || null);
  const [tema, setTema] = useState(searchParams?.tema || null);
  const [temasOptions, setTemasOptions] = useState([]);
  const router = useRouter();

  const columns = [
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
    },
    {
      title: 'Pendiente',
      dataIndex: 'pendiente',
      key: 'pendiente',
      width: 100,
      render: (value) => value === 1 ? 'Sí' : 'No',
    },
    {
      title: 'Vencidos',
      dataIndex: 'vencidos',
      key: 'vencidos',
      width: 100,
      render: (value) => value === 1 ? 'Sí' : 'No',
    },
    {
      title: 'Radicado de Entrada',
      dataIndex: 'radicado',
      key: 'radicado',
      width: 180,
    },
    {
      title: 'Fecha Límite Respuesta',
      dataIndex: 'fecha_limite_de_respuesta',
      key: 'fecha_limite_de_respuesta',
      width: 180,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Tema',
      dataIndex: 'tema',
      key: 'tema',
      width: 200,
    },
    {
      title: 'Subsecretaría',
      dataIndex: 'subsecretaria',
      key: 'subsecretaria',
      width: 150,
    },
    {
      title: 'Código',
      dataIndex: 'cod_subsecretaria',
      key: 'cod_subsecretaria',
      width: 100,
    },
  ];

  useEffect(() => {
    if (subsecretaria) {
      setLoading(true);
      axios.get('http://10.125.8.55:5000/api/data/stats/temas-by-subsecretaria', {
        params: { cod_subsecretaria: subsecretaria }
      })
        .then(response => {
          setTemasOptions(response.data.data.map(tema => ({
            value: tema,
            label: tema,
          })));
        })
        .catch(error => {
          console.error('Error al cargar temas:', error);
          message.error('Error al cargar los temas');
        })
        .finally(() => setLoading(false));
    } else {
      setTemasOptions([]);
    }
  }, [subsecretaria]);

  useEffect(() => {
    if (subsecretaria) {
      fetchData();
    }
  }, [subsecretaria, tema]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://10.125.8.55:5000/api/data/stats/files-reports', {
        params: {
          cod_subsecretaria: subsecretaria,
          tema: tema
        }
      });

      // ✅ Protección contra datos inválidos
      setData(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      message.error('Error al cargar los datos');
      setData([]); // Para evitar errores con datos corruptos
    } finally {
      setLoading(false);
    }
  };

  //const handleDownload = () => {
    //const params = new URLSearchParams();
    //if (subsecretaria) params.append('cod_subsecretaria', subsecretaria);
    //if (tema) params.append('tema', tema);
    //params.append('download', 'true');

    //window.open(`/api/data/stats/files-reports?${params.toString()}`, '_blank');
  //};

  const handleExportToExcel = () => {
    const params = new URLSearchParams();

    if (subsecretaria) {
        params.append("cod_subsecretaria", subsecretaria);
    }

    if (tema) {
        params.append("tema", tema);
    }

    params.append("download", "true");

    // 🔄 Usa location.href para iniciar descarga sin abrir nueva pestaña
    window.location.href = `http://10.125.8.55:5000/api/data/stats/files-reports?${params.toString()}`;
    };


  return (
    <div style={{ padding: '20px' }}>
      <h1>Reporte de PQRS</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Select
          placeholder="Seleccione subsecretaría"
          style={{ width: 250 }}
          value={subsecretaria}
          onChange={(value) => {
            setSubsecretaria(value);
            setTema(null);
          }}
          options={[
            { value: 'SSC01', label: 'Catastro' },
            { value: 'SSCU01', label: 'Control Urbanístico' },
            { value: 'SSP01', label: 'Servicios Públicos' },
            { value: 'D01', label: 'Despacho' },
          ]}
        />

        <Select
          placeholder="Seleccione tema"
          style={{ width: 250 }}
          value={tema}
          onChange={setTema}
          disabled={!subsecretaria}
          options={temasOptions}
        />

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportToExcel}
          disabled={data.length === 0}
        >
          Exportar a Excel
        </Button>
      </div>

      <Button
        onClick={() => router.push('/graficas')}
        style={{
          background: 'linear-gradient(135deg, #1890ff, #096dd9)',
          border: 'none',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 600,
          padding: '0 24px',
          height: '42px',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.3s ease',
          ':hover': {
            background: 'linear-gradient(135deg, #40a9ff, #1890ff)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(24, 144, 255, 0.4)'
          },
          ':active': {
            transform: 'translateY(0)'
          }
        }}
        icon={<ArrowLeftOutlined style={{ fontSize: '16px' }} />}
      >
        Volver al Dashboard
      </Button>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          // ✅ Asegura que siempre haya una clave única
          rowKey={(record) => record.radicado_de_respuesta || record.id || Math.random()}
          scroll={{ x: 1500 }}
          bordered
          size="middle"
          style={{ marginTop: '16px' }}
        />
      </Spin>
    </div>
  );
};

export default FileReports;

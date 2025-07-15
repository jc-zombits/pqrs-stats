'use client'

import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Spin, Alert } from 'antd';
import axios from 'axios';

const RegistrosAbiertosModal = ({ visible, onClose, filters }) => {  // Cambia los parámetros a filters
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = [
    {
      title: 'Tema',
      dataIndex: 'tema',
      key: 'tema',
    },
    {
      title: 'Subsecretaría',
      dataIndex: 'subsecretaria',
      key: 'subsecretaria',
    },
    {
      title: 'Fecha Ingreso',
      dataIndex: 'fecha_de_ingreso',
      key: 'fecha_de_ingreso',
      render: date => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Fecha Límite',
      dataIndex: 'fecha_limite_de_respuesta',
      key: 'fecha_limite_de_respuesta',
      render: date => {
        if (!date) return 'N/A';
        const fechaLimite = new Date(date);
        const hoy = new Date();
        let color = 'default';
        
        if (fechaLimite < hoy) color = 'red';
        else if (fechaLimite < new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000)) color = 'orange';
        
        return (
          <Tag color={color}>
            {fechaLimite.toLocaleDateString()}
          </Tag>
        );
      }
    },
    {
      title: 'Estado en Ruta',
      dataIndex: 'ultimo_estado_en_ruta',
      key: 'ultimo_estado_en_ruta',
      render: estado => {
        if (estado === 'E') return 'EVACUADO';
        if (estado === 'P') return 'PENDIENTE';
        return estado || 'N/A';
      }
    },
  ];

  useEffect(() => {
    if (visible) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Usa filters directamente como parámetros
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/registros-abiertos`,
            { params: filters }  // Pasa el objeto filters completo
          );
          
          setRegistros(response.data.registros || []);
        } catch (err) {
          console.error('Error al obtener registros:', err);
          setError(err.response?.data?.error || 'Error al cargar los registros');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [visible, filters]);  // Dependencia ahora es filters

  return (
    <Modal
      title={`PQRS Abiertas (${registros.length})`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="80%"
      style={{ top: 20 }}
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert type="error" message="Error" description={error} showIcon />
      ) : (
        <Table
            columns={columns}
            dataSource={registros}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 500 }}
            rowKey="id"
        />
      )}
    </Modal>
  );
};

export default RegistrosAbiertosModal;
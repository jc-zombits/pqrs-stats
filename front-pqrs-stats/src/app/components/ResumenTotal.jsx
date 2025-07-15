'use client'

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Statistic, Alert, Select } from 'antd';
import axios from 'axios';
import RegistrosAbiertosModal from './RegistrosAbiertosModal';
import { useRouter } from 'next/navigation';

const ResumenTotal = () => {
    const router = useRouter();
    // Estados de UI
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [modalAbiertasVisible, setModalAbiertasVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados de filtros
    const [codSubsecretaria, setCodSubsecretaria] = useState(null);
    const [subsecretarias, setSubsecretarias] = useState([]);
    const [tema, setTema] = useState(null);
    const [temas, setTemas] = useState([]);
    
    // Estado combinado de datos
    const [stats, setStats] = useState({
        // Datos originales
        total: 0,
        oportuno: 0,
        no_oportuno: 0,
        a_tiempo: 0,
        abiertas: 0,
        finalizadas: 0,
        periodo: 'Cargando...',
        // Nuevos datos
        e_finalizado: 0,    // Evacuadas/Finalizadas
        e_abierto: 0,       // Evacuadas/Abiertas
        p_finalizado: 0,    // Pendientes/Finalizadas
        p_abierto: 0,       // Pendientes/Abiertas
        vencidos: 0,        // Vencidas
        pendiente: 0        // Pendientes
    });

    // Estilo de las tarjetas
    const getCardStyle = (index) => ({
        width: '100%',
        height: '100%',
        boxShadow: hoveredIndex === index ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
        cursor: 'pointer'
    });

    // Cargar subsecretarías (solo una vez al montar)
    useEffect(() => {
        const fetchSubsecretarias = async () => {
            try {
                const resp = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/codigos-subsecretaria`);
                const codigosUnicosMap = new Map();
                resp.data.forEach(item => {
                    codigosUnicosMap.set(item.cod_subsecretaria, item);
                });
                setSubsecretarias(Array.from(codigosUnicosMap.values()));
            } catch (err) {
                console.error('Error cargando subsecretarías:', err);
            }
        };
        fetchSubsecretarias();
    }, []);

    // Cargar temas cuando cambia la subsecretaría
    useEffect(() => {
        const fetchTemas = async () => {
            if (!codSubsecretaria) {
                setTemas([]);
                setTema(null);
                return;
            }

            try {
                const resp = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/temas`,
                    { params: { cod_subsecretaria: codSubsecretaria } }
                );
                const temasFiltrados = resp.data.map(item => item.tema).filter(Boolean);
                setTemas(temasFiltrados);
                setTema(null);
            } catch (err) {
                console.error('Error cargando temas:', err);
                setTemas([]);
            }
        };
        fetchTemas();
    }, [codSubsecretaria]);

    // Función para cargar todos los datos
    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {};
                if (codSubsecretaria) params.cod_subsecretaria = codSubsecretaria;
                if (tema) params.tema = tema;

            // Hacer ambas llamadas en paralelo
            const [resumenData, pendientesData] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/resumen-total-tarjetas`, { params, timeout: 10000 }),
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/data/stats/resumen-total-pendientes`, { params, timeout: 10000 })
            ]);

            setStats({
                // Datos del primer endpoint
                total: resumenData.data?.total ?? 0,
                oportuno: resumenData.data?.oportuno ?? 0,
                no_oportuno: resumenData.data?.no_oportuno ?? 0,
                a_tiempo: resumenData.data?.a_tiempo ?? 0,
                abiertas: resumenData.data?.abiertas ?? 0,
                finalizadas: resumenData.data?.finalizadas ?? 0,
                periodo: resumenData.data?.periodo ?? 'Periodo no disponible',
                    // Datos del segundo endpoint
                e_finalizado: pendientesData.data?.data?.e_finalizado ?? 0,
                e_abierto: pendientesData.data?.data?.e_abierto ?? 0,
                p_finalizado: pendientesData.data?.data?.p_finalizado ?? 0,
                p_abierto: pendientesData.data?.data?.p_abierto ?? 0,
                vencidos: pendientesData.data?.data?.vencidos ?? 0,
                pendiente: pendientesData.data?.data?.pendiente ?? 0
            });
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError(err.response?.data?.error || 'Error al cargar los datos. Intente recargar.');
        } finally {
            setLoading(false);
        }
    };

    // Efecto principal que carga los datos cuando cambian los filtros
    useEffect(() => {
        fetchAllData();
    }, [codSubsecretaria, tema]);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '200px'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                type="error"
                message="Error"
                description={error}
                showIcon
                style={{ margin: 20 }}
            />
        );
    }

    const cardData = [
        // Tarjetas originales
        { 
            title: "Total PQRS 🕒", 
            value: stats.total, 
            color: '#1890ff', 
            onClick: null,
            description: "Número total de PQRS registradas en el sistema" 
        },
        { 
            title: "Oportuno 💡", 
            value: stats.oportuno, 
            color: '#52c41a', 
            onClick: null,
            description: "PQRS respondidas dentro del plazo establecido" 
        },
        { 
            title: "No Oportuno ⚠️", 
            value: stats.no_oportuno, 
            color: '#f5222d', 
            onClick: null,
            description: "PQRS respondidas fuera del plazo establecido" 
        },
        { 
            title: "A Tiempo ⏳", 
            value: stats.a_tiempo, 
            color: '#faad14', 
            onClick: null,
            description: "PQRS que aún están dentro del plazo para respuesta" 
        },
        { 
            title: "Abiertas 🎯", 
            value: stats.abiertas, 
            color: '#13c2c2',
            onClick: () => setModalAbiertasVisible(true),
            description: "PQRS que están en proceso de atención" 
        },
        { 
            title: "Finalizadas 🧱", 
            value: stats.finalizadas, 
            color: '#722ed1', 
            onClick: null,
            description: "PQRS que han sido cerradas o completadas" 
        },
        // Nuevas tarjetas (ajustadas al endpoint)
        { 
            title: "Pendientes/Finalizadas 🕒", 
            value: stats.p_finalizado, 
            color: '#1890ff', 
            onClick: null,
            description: "PQRS pendientes pero con estado finalizado" 
        },
        { 
            title: "Pendientes/Abiertas 💡", 
            value: stats.p_abierto, 
            color: '#52c41a', 
            onClick: null,
            description: "PQRS pendientes y aún en proceso" 
        },
        { 
            title: "Evacuadas/Finalizadas ⚠️", 
            value: stats.e_finalizado, 
            color: '#f5222d', 
            onClick: null,
            description: "PQRS evacuadas y marcadas como finalizadas" 
        },
        { 
            title: "Evacuadas/Abiertas ⏳", 
            value: stats.e_abierto, 
            color: '#faad14', 
            onClick: null,
            description: "PQRS evacuadas pero aún en proceso" 
        },
        { 
            title: "Pendientes 🎯", 
            value: stats.pendiente, 
            color: '#13c2c2', 
            onClick: () => {
                const params = new URLSearchParams();
                if (codSubsecretaria) params.set('cod_subsecretaria', codSubsecretaria);
                if (tema) params.set('tema', tema);
                
                router.push(`/stats/files-reports?${params.toString()}`);
            },
            description: "PQRS que requieren atención inmediata" 
        },
        { 
            title: "Vencidas 🧱", 
            value: stats.vencidos, 
            color: '#722ed1', 
            onClick: null,
            description: "PQRS que han excedido el plazo de respuesta" 
        }
    ];

    return (
        <div style={{ padding: '16px', width: '100%' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold', color: '#666' }}>
                Resumen PQRS || Enero a {stats.periodo}
            </h2>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <label style={{ marginRight: 8, color: '#0118D8', fontWeight: 'bold', fontSize: '16px' }}>Filtrar por Subsecretaría:</label>
                    <Select
                        allowClear
                        placeholder="Seleccione una subsecretaría"
                        style={{ width: '100%' }}
                        value={codSubsecretaria}
                        onChange={value => setCodSubsecretaria(value)}
                        options={subsecretarias.map(item => ({
                            value: item.cod_subsecretaria,
                            label: `${item.cod_subsecretaria} - ${item.subsecretaria}`
                        }))}
                    />
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <label style={{ marginRight: 8, color: '#0118D8', fontWeight: 'bold', fontSize: '16px' }}>Filtrar por Tema:</label>
                    <Select
                        allowClear
                        placeholder={codSubsecretaria ? "Seleccione un tema" : "Primero seleccione subsecretaría"}
                        style={{ width: '100%' }}
                        value={tema}
                        onChange={setTema}
                        options={temas.map(t => ({ value: t, label: t }))}
                        disabled={!codSubsecretaria}
                    />
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ width: '100%' }}>
                {cardData.map((item, index) => (
                    <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4} style={{ display: 'flex' }}>
                        <Card
                            style={getCardStyle(index)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={item.onClick}
                        >
                            <Statistic
                                title={<span style={{ fontWeight: '500' }}>{item.title}</span>}
                                value={item.value}
                                valueStyle={{
                                    color: item.color,
                                    fontSize: '24px',
                                    fontWeight: 'bold'
                                }}
                            />
                            <div style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#666',
                                lineHeight: '1.4'
                            }}>
                                {item.description}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <RegistrosAbiertosModal
                visible={modalAbiertasVisible}
                onClose={() => setModalAbiertasVisible(false)}
                filters={{ 
                    cod_subsecretaria: codSubsecretaria, 
                    tema: tema 
                }}
            />
        </div>
    );
};

export default ResumenTotal;
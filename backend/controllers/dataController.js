const pool = require('../db');
const excel = require('exceljs');

const getDataStats = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sis_catastro_tramites.gestion_pqrs_data'); // ← Cambia "tu_tabla"
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener datos:', error); // Mostrar error real
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Tarjetas de resumen total
const getResumenTotalStats = async (req, res) => {
  try {
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    const { cod_subsecretaria, tema } = req.query;

    const ultimoPeriodo = await pool.query(`
      SELECT anio, mes
      FROM sis_catastro_tramites.gestion_pqrs_data
      ORDER BY anio DESC, mes DESC
      LIMIT 1
    `);

    if (!ultimoPeriodo.rows[0]) {
      return res.status(200).json({
        total: 0,
        oportuno: 0,
        no_oportuno: 0,
        a_tiempo: 0,
        abiertas: 0,
        finalizadas: 0,
        periodo: 'Sin datos',
        message: 'No hay datos disponibles'
      });
    }

    const { anio, mes } = ultimoPeriodo.rows[0];
    const periodoTexto = `${monthNames[mes - 1]}/${anio}`;

    const queryParams = [anio, mes];
    let filtro = 'anio = $1 AND mes BETWEEN 1 AND $2';

    if (cod_subsecretaria) {
      filtro += ` AND cod_subsecretaria = $${queryParams.length + 1}`;
      queryParams.push(cod_subsecretaria);
    }

    if (tema) {
      filtro += ` AND tema = $${queryParams.length + 1}`;
      queryParams.push(tema);
    }

    const result = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN oportunidad = 'OPORTUNO' THEN 1 END) as oportuno,
        COUNT(CASE WHEN oportunidad = 'NO OPORTUNO' THEN 1 END) as no_oportuno,
        COUNT(CASE WHEN oportunidad = 'A TIEMPO' THEN 1 END) as a_tiempo,
        COUNT(CASE WHEN estado = 'ABIERTO' THEN 1 END) as abiertas,
        COUNT(CASE WHEN estado = 'FINALIZADO' THEN 1 END) as finalizadas
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE ${filtro}
      `,
      queryParams
    );

    const responseData = {
      total: Number(result.rows[0]?.total) || 0,
      oportuno: Number(result.rows[0]?.oportuno) || 0,
      no_oportuno: Number(result.rows[0]?.no_oportuno) || 0,
      a_tiempo: Number(result.rows[0]?.a_tiempo) || 0,
      abiertas: Number(result.rows[0]?.abiertas) || 0,
      finalizadas: Number(result.rows[0]?.finalizadas) || 0,
      periodo: periodoTexto,
      ultimo_mes: mes,
      ultimo_anio: anio
    };

    console.log('Datos enviados al frontend:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error detallado en getResumenStats:', {
      message: error.message,
      stack: error.stack,
      query: error.query
    });

    res.status(500).json({
      error: 'Error al obtener estadísticas de resumen',
      detalles: process.env.NODE_ENV === 'development' ? error.message : ''
    });
  }
};

const getResumenTotalPendientes = async (req, res) => {
  try {
    const { cod_subsecretaria, tema } = req.query;

    // Construir condiciones WHERE adicionales
    let filtroSubsecretaria = '';
    let filtroTema = '';
    
    if (cod_subsecretaria) {
      filtroSubsecretaria = `AND cod_subsecretaria = '${cod_subsecretaria}'`;
    }
    
    if (tema) {
      filtroTema = `AND tema = '${tema}'`;
    }

    const [
      eFinalizado,
      eAbierto,
      pFinalizado,
      pAbierto,
      vencidos,
      pendiente
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) FROM sis_catastro_tramites.gestion_pqrs_data 
        WHERE ultimo_estado_en_ruta = 'E' AND estado = 'FINALIZADO'
        ${filtroSubsecretaria} ${filtroTema}
      `),
      pool.query(`
        SELECT COUNT(*) FROM sis_catastro_tramites.gestion_pqrs_data 
        WHERE ultimo_estado_en_ruta = 'E' AND estado = 'ABIERTO'
        ${filtroSubsecretaria} ${filtroTema}
      `),
      pool.query(`
        SELECT COUNT(*) FROM sis_catastro_tramites.gestion_pqrs_data 
        WHERE ultimo_estado_en_ruta = 'P' AND estado = 'FINALIZADO'
        ${filtroSubsecretaria} ${filtroTema}
      `),
      pool.query(`
        SELECT COUNT(*) FROM sis_catastro_tramites.gestion_pqrs_data 
        WHERE ultimo_estado_en_ruta = 'P' AND estado = 'ABIERTO'
        ${filtroSubsecretaria} ${filtroTema}
      `),
      pool.query(`
        SELECT COUNT(*) FROM sis_catastro_tramites.gestion_pqrs_data 
        WHERE vencidos <> 0
        ${filtroSubsecretaria} ${filtroTema}
      `),
      pool.query(`
        SELECT COUNT(*) FROM sis_catastro_tramites.gestion_pqrs_data 
        WHERE pendiente <> 0
        ${filtroSubsecretaria} ${filtroTema}
      `)
    ]);

    res.json({
      success: true,
      data: {
        e_finalizado: parseInt(eFinalizado.rows[0].count),
        e_abierto: parseInt(eAbierto.rows[0].count),
        p_finalizado: parseInt(pFinalizado.rows[0].count),
        p_abierto: parseInt(pAbierto.rows[0].count),
        vencidos: parseInt(vencidos.rows[0].count),
        pendiente: parseInt(pendiente.rows[0].count),
      }
    });
  } catch (error) {
    console.error('Error en getResumenTotalPendientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el resumen de pendientes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Endpoint para registros abiertos
// Obtener registros abiertos con fecha límite
const getRegistrosAbiertos = async (req, res) => {
  try {
    const { cod_subsecretaria, tema } = req.query;
    
    let query = `
      SELECT 
        id,
        tema,
        subsecretaria,
        cod_subsecretaria,
        fecha_de_ingreso,
        fecha_limite_de_respuesta,
        ultimo_estado_en_ruta,
        oportunidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE estado = 'ABIERTO'
    `;
    
    const params = [];
    
    // Agregar filtros si existen
    if (cod_subsecretaria) {
      params.push(cod_subsecretaria);
      query += ` AND cod_subsecretaria = $${params.length}`;
    }
    
    if (tema) {
      params.push(tema);
      query += ` AND tema = $${params.length}`;
    }
    
    // Ordenar por fecha límite (las más urgentes primero)
    query += ` ORDER BY fecha_limite_de_respuesta ASC`;
    
    console.log('Ejecutando consulta:', query);
    console.log('Parámetros:', params);
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      count: result.rowCount,
      registros: result.rows.map(registro => ({
        ...registro,
        // Formatear fechas para el frontend
        fecha_de_ingreso: registro.fecha_de_ingreso ? new Date(registro.fecha_de_ingreso).toISOString() : null,
        fecha_limite_de_respuesta: registro.fecha_limite_de_respuesta ? new Date(registro.fecha_limite_de_respuesta).toISOString() : null
      }))
    });
    
  } catch (error) {
    console.error('Error en getRegistrosAbiertos:', {
      message: error.message,
      stack: error.stack,
      query: error.query || 'No disponible',
      parameters: error.parameters || 'No disponible'
    });
    
    res.status(500).json({
      error: 'Error al obtener registros abiertos',
      detalles: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        query: error.query
      } : null
    });
  }
};

/// temas
const getTemas = async (req, res) => {
  try {
    const { cod_subsecretaria } = req.query;

    if (!cod_subsecretaria) {
      return res.status(400).json({ error: 'Se requiere cod_subsecretaria' });
    }

    const result = await pool.query(`
      SELECT DISTINCT tema
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE tema IS NOT NULL 
        AND tema <> ''
        AND cod_subsecretaria = $1
      ORDER BY tema
    `, [cod_subsecretaria]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error cargando temas:', err);
    res.status(500).json({ error: 'Error al obtener temas' });
  }
};

// Endpoint estadisticas de pqrs por mes de acuerdo al tema
const getEstadisticasPqrsPorMesYTema = async (req, res) => {
  try {
    const { subsecretaria, anio } = req.query;

    if (!subsecretaria) {
      return res.status(400).json({ error: 'Parámetro subsecretaria requerido' });
    }
    if (!anio) {
      return res.status(400).json({ error: 'Parámetro anio requerido' });
    }

    // Consulta para obtener el máximo mes registrado para el año y subsecretaría
    const maxMesResult = await pool.query(`
      SELECT MAX(mes) AS max_mes
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE subsecretaria = $1 AND anio = $2
    `, [subsecretaria, parseInt(anio)]);

    const maxMes = maxMesResult.rows[0].max_mes;

    if (!maxMes) {
      // No hay datos para ese año y subsecretaría
      return res.status(200).json([]);
    }

    // Consulta principal filtrando por mes <= maxMes
    const result = await pool.query(`
      SELECT 
        mes,
        tema,
        COUNT(*) AS cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE subsecretaria = $1 AND anio = $2 AND mes <= $3
      GROUP BY mes, tema
      ORDER BY mes ASC
    `, [subsecretaria, parseInt(anio), maxMes]);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error en getPqrsPorMesYTema:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas por mes y tema' });
  }
};

// Endpoint para las estadisticas del select
const getEstadisticasSubsecretarias = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT subsecretaria
      FROM sis_catastro_tramites.gestion_pqrs_data
      ORDER BY subsecretaria
    `);
    // Devuelve array de objetos con 'subsecretaria' como texto
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las subsecretarías' });
  }
};

// Tarjetas de resumen - por mes
const getResumenStats = async (req, res) => {
  try {
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    const { cod_subsecretaria } = req.query;

    const ultimoPeriodo = await pool.query(`
      SELECT anio, mes
      FROM sis_catastro_tramites.gestion_pqrs_data
      ORDER BY anio DESC, mes DESC
      LIMIT 1
    `);

    if (!ultimoPeriodo.rows[0]) {
      return res.status(200).json({
        total: 0,
        oportuno: 0,
        no_oportuno: 0,
        a_tiempo: 0,
        abiertas: 0,
        finalizadas: 0,
        periodo: 'Sin datos',
        message: 'No hay datos disponibles'
      });
    }

    const { anio, mes } = ultimoPeriodo.rows[0];
    const periodoTexto = `${monthNames[mes - 1]}/${anio}`;

    const queryParams = [anio, mes];
    let filtro = 'anio = $1 AND mes = $2';

    if (cod_subsecretaria) {
      filtro += ' AND cod_subsecretaria = $3';
      queryParams.push(cod_subsecretaria);
    }

    const result = await pool.query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN oportunidad = 'OPORTUNO' THEN 1 END) as oportuno,
        COUNT(CASE WHEN oportunidad = 'NO OPORTUNO' THEN 1 END) as no_oportuno,
        COUNT(CASE WHEN oportunidad = 'A TIEMPO' THEN 1 END) as a_tiempo,
        COUNT(CASE WHEN estado = 'ABIERTO' THEN 1 END) as abiertas,
        COUNT(CASE WHEN estado = 'FINALIZADO' THEN 1 END) as finalizadas
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE ${filtro}
      `,
      queryParams
    );

    const responseData = {
      total: Number(result.rows[0]?.total) || 0,
      oportuno: Number(result.rows[0]?.oportuno) || 0,
      no_oportuno: Number(result.rows[0]?.no_oportuno) || 0,
      a_tiempo: Number(result.rows[0]?.a_tiempo) || 0,
      abiertas: Number(result.rows[0]?.abiertas) || 0,
      finalizadas: Number(result.rows[0]?.finalizadas) || 0,
      periodo: periodoTexto,
      ultimo_mes: mes,
      ultimo_anio: anio
    };

    console.log('Datos enviados al frontend:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error detallado en getResumenStats:', {
      message: error.message,
      stack: error.stack,
      query: error.query
    });

    res.status(500).json({
      error: 'Error al obtener estadísticas de resumen',
      detalles: process.env.NODE_ENV === 'development' ? error.message : ''
    });
  }
};

const getCodigosSubsecretaria = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT cod_subsecretaria, subsecretaria
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE cod_subsecretaria IS NOT NULL
      ORDER BY cod_subsecretaria
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener códigos de subsecretaría:', error);
    res.status(500).json({ error: 'Error al obtener códigos de subsecretaría' });
  }
};


// Nueva consulta, estadísticas por estado
const getEstadoMesStats = async (req, res) => {
  const { year } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT estado, mes, COUNT(*) AS cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE (anio, mes) = (
        SELECT anio, mes
        FROM sis_catastro_tramites.gestion_pqrs_data
        ORDER BY anio DESC, mes DESC
        LIMIT 1
      )
      GROUP BY estado, mes
      ORDER BY estado, mes;
    `);

    // Encontrar el último mes con datos
    const ultimoMesConDatos = result.rows.length > 0 
      ? Math.max(...result.rows.map(row => row.mes)) 
      : 0;

    // Preparar datasets
    const estados = [...new Set(result.rows.map(row => row.estado))];
    const datasets = estados.map(estado => {
      const data = Array(12).fill(0);
      result.rows
        .filter(row => row.estado === estado)
        .forEach(row => data[row.mes - 1] = parseInt(row.cantidad));
      
      return {
        estado,
        data: year === new Date().getFullYear() 
          ? data.slice(0, ultimoMesConDatos) // Cortar para año actual
          : data // Mostrar completo para años pasados
      };
    });

    res.json({
      labels: Array.from(
        {length: year === new Date().getFullYear() ? ultimoMesConDatos : 12}, 
        (_, i) => (i + 1).toString()
      ),
      datasets
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// nueva consulta - oportunidad
const getOportunidadPorDia = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let query = `
      SELECT
        fecha_de_ingreso::date AS fecha,
        COUNT(*) FILTER (WHERE oportunidad = 'OPORTUNO') AS oportuno,
        COUNT(*) FILTER (WHERE oportunidad = 'NO OPORTUNO') AS no_oportuno,
        COUNT(*) FILTER (WHERE oportunidad = 'A TIEMPO') AS a_tiempo
      FROM sis_catastro_tramites.gestion_pqrs_data
    `;
    
    const conditions = [];
    const params = [];
    
    if (year && year !== 'all') {
      conditions.push(`EXTRACT(YEAR FROM fecha_de_ingreso::date) = $${params.length + 1}`);
      params.push(parseInt(year)); // Asegúrate de que sea un número
    }
    
    if (month && month !== 'all') {
      conditions.push(`EXTRACT(MONTH FROM fecha_de_ingreso::date) = $${params.length + 1}`);
      params.push(parseInt(month)); // Asegúrate de que sea un número
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY fecha_de_ingreso::date ORDER BY fecha`;

    const result = await pool.query(query, params);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error("Error al obtener estadísticas por oportunidad:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Nueva consuñta - tema por mes
const getSubsecretarias = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        cod_subsecretaria,
        subsecretaria 
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE subsecretaria IS NOT NULL
      ORDER BY subsecretaria
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener subsecretarías:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getAniosDisponibles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        DATE_PART('year', fecha_de_ingreso::date) as anio
      FROM sis_catastro_tramites.gestion_pqrs_data
      ORDER BY anio DESC
    `);
    res.json(result.rows.map(row => row.anio));
  } catch (error) {
    console.error("Error al obtener años disponibles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getTemaMesStats = async (req, res) => {
  try {
    const { cod_subsecretaria, anio } = req.query;
    
    let query = `
      SELECT 
        mes,
        tema,
        COUNT(*) AS cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
    `;
    
    const conditions = [];
    const params = [];
    
    if (cod_subsecretaria && cod_subsecretaria !== 'all') {
      conditions.push(`cod_subsecretaria = $${params.length + 1}`);
      params.push(cod_subsecretaria);
    }
    
    if (anio && anio !== 'all') {
      conditions.push(`DATE_PART('year', fecha_de_ingreso) = $${params.length + 1}`);
      params.push(anio);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY mes, tema
      ORDER BY mes ASC, cantidad DESC;
    `;

    const result = await pool.query(query, params);

    // Reorganizamos los datos por mes
    const data = {};
    result.rows.forEach(row => {
      const { mes, tema, cantidad } = row;
      if (!data[mes]) {
        data[mes] = [];
      }
      data[mes].push({ tema, cantidad: parseInt(cantidad) });
    });

    res.json(data);
  } catch (error) {
    console.error("Error al obtener estadísticas por tema y mes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Nuevo controlador específico para el modal - no afecta el existente
const getEstadisticasEstadoParaModal = async (req, res) => {
  try {
    const { tema, mes, anio, subsecretaria } = req.query;
    
    // Consulta para obtener los conteos por estado
    const query = `
      WITH estados_base AS (
        SELECT unnest(ARRAY['ABIERTO', 'FINALIZADO']) AS estado
      ),
      conteos AS (
        SELECT 
          estado,
          COUNT(*) AS cantidad
        FROM sis_catastro_tramites.gestion_pqrs_data
        WHERE tema = $1
          ${mes ? ' AND mes = $2' : ''}
          ${anio ? ' AND DATE_PART(\'year\', fecha_de_ingreso::date) = $3' : ''}
          ${subsecretaria ? ' AND cod_subsecretaria = $4' : ''}
        GROUP BY estado
      )
      SELECT 
        eb.estado,
        COALESCE(c.cantidad, 0) AS cantidad
      FROM estados_base eb
      LEFT JOIN conteos c ON eb.estado = c.estado
      ORDER BY eb.estado;
    `;
    
    const params = [tema];
    if (mes) params.push(mes);
    if (anio) params.push(anio);
    if (subsecretaria) params.push(subsecretaria);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estadísticas para modal:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// nueva consulta - tema-estado
const getTemaEstadoStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tema, estado, COUNT(*) as cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE (anio, mes) = (
        SELECT anio, mes
        FROM sis_catastro_tramites.gestion_pqrs_data
        ORDER BY anio DESC, mes DESC
        LIMIT 1
      )
      GROUP BY tema, estado
      ORDER BY tema, estado;
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Error al obtener estadísticas por tema y estado:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// nueva consulta - mes-fecha de ingreso (cantidad)
const getIngresosPorDiaPorMes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM fecha_de_ingreso::date) AS mes,
        TO_CHAR(fecha_de_ingreso::date, 'YYYY-MM-DD') AS fecha_de_ingreso,
        COUNT(*) AS cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      GROUP BY mes, fecha_de_ingreso
      ORDER BY mes, fecha_de_ingreso
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ingresos por día por mes:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// nueva consulta - ultimo estado en ruta por mes y tema
const getEstadoRutaPorMesYTema = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        mes,
        tema,
        ultimo_estado_en_ruta,
        COUNT(*) AS cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      GROUP BY mes, tema, ultimo_estado_en_ruta
      ORDER BY mes, tema, ultimo_estado_en_ruta
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estadísticas por mes, tema y estado en ruta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Nueva consulta: Cantidad de temas por estado
const getCantidadTemasPorEstado = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mes,
        tema, 
        estado, 
        COUNT(*) AS cantidad
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE estado IN ('ABIERTO', 'FINALIZADO')
      GROUP BY mes, tema, estado
      ORDER BY mes, tema, estado;
    `);

    // Crear un array para almacenar los resultados en el formato que deseas
    const data = [];

    // Reorganizar los datos
    result.rows.forEach(row => {
      const mes = row.mes; // Mes
      const tema = row.tema; // Tema
      const estado = row.estado; // Estado
      const cantidad = parseInt(row.cantidad); // Cantidad

      // Buscar si el tema ya existe para el mes
      const existingEntry = data.find(entry => entry.tema === tema && entry.mes === mes);

      if (existingEntry) {
        // Si existe, actualizar la cantidad para el estado correspondiente
        existingEntry[`Estado_${estado}`] = cantidad;
      } else {
        // Si no existe, agregar un nuevo objeto con los valores correspondientes
        const newEntry = {
          tema: tema,
          Estado_ABIERTO: estado === 'ABIERTO' ? cantidad : 0,
          Estado_FINALIZADO: estado === 'FINALIZADO' ? cantidad : 0,
          mes: mes
        };
        data.push(newEntry);
      }
    });

    // Devolver los resultados en formato JSON
    res.json(data);
  } catch (error) {
    console.error("Error al obtener cantidad de temas por estado:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getFilePqrsReports = async (req, res) => {
  const { cod_subsecretaria, tema } = req.query;

  try {
    let query = `
      SELECT 
        estado, 
        pendiente, 
        vencidos, 
        radicado, 
        fecha_limite_de_respuesta, 
        tema, 
        subsecretaria, 
        cod_subsecretaria
      FROM sis_catastro_tramites.gestion_pqrs_data
    `;

    const queryParams = [];
    let whereClauses = [];

    // ✅ Filtro fijo: solo estado ABIERTO
    whereClauses.push(`estado = 'ABIERTO'`);

    // Filtro por subsecretaría si se proporciona
    if (cod_subsecretaria) {
      whereClauses.push(`cod_subsecretaria = $${queryParams.length + 1}`);
      queryParams.push(cod_subsecretaria);
    }

    // Filtro por tema si se proporciona
    if (tema) {
      whereClauses.push(`tema = $${queryParams.length + 1}`);
      queryParams.push(tema);
    }

    // Construir la consulta final
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Ejecutar la consulta
    const { rows } = await pool.query(query, queryParams);

    // Si se solicita descargar como Excel
    if (req.query.download === 'true') {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet('Reporte PQRS');

      // Configurar columnas del Excel
      worksheet.columns = [
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Pendiente', key: 'pendiente', width: 15 },
        { header: 'Vencidos', key: 'vencidos', width: 15 },
        { header: 'Radicado de Entrada', key: 'radicado', width: 25 },
        { header: 'Fecha Límite de Respuesta', key: 'fecha_limite_de_respuesta', width: 25 },
        { header: 'Tema', key: 'tema', width: 30 },
        { header: 'Subsecretaría', key: 'subsecretaria', width: 25 },
        { header: 'Código Subsecretaría', key: 'cod_subsecretaria', width: 20 }
      ];

      // Añadir datos
      rows.forEach(row => {
        worksheet.addRow(row);
      });

      // Configurar respuesta para descarga
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=reporte_pqrs.xlsx'
      );

      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    }

    // Si no es descarga, devolver JSON
    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error en getFilePqrsReports:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte de PQRS',
      error: error.message
    });
  }
};


// Endpoint para obtener los temas por subsecretaría
const getTemasBySubsecretaria = async (req, res) => {
  const { cod_subsecretaria } = req.query;

  try {
    const query = `
      SELECT DISTINCT tema 
      FROM sis_catastro_tramites.gestion_pqrs_data
      WHERE cod_subsecretaria = $1
      ORDER BY tema
    `;

    const { rows } = await pool.query(query, [cod_subsecretaria]);

    res.json({
      success: true,
      data: rows.map(row => row.tema)
    });

  } catch (error) {
    console.error('Error en getTemasBySubsecretaria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los temas',
      error: error.message
    });
  }
};


module.exports = { getDataStats, getEstadoMesStats, getOportunidadPorDia, getTemaMesStats, getEstadisticasEstadoParaModal, getSubsecretarias, getAniosDisponibles, getTemaEstadoStats, getIngresosPorDiaPorMes, getEstadoRutaPorMesYTema, getCantidadTemasPorEstado, getResumenTotalStats, getResumenStats, getCodigosSubsecretaria, getTemas, getRegistrosAbiertos, getResumenTotalPendientes, getFilePqrsReports, getTemasBySubsecretaria, getEstadisticasPqrsPorMesYTema, getEstadisticasSubsecretarias };

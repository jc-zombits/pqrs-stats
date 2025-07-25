const express = require('express');
const router = express.Router();
const { 
  getDataStats, 
  getEstadoMesStats, 
  getOportunidadPorDia, 
  getTemaMesStats,
  getEstadisticasEstadoParaModal,
  getSubsecretarias,
  getAniosDisponibles,
  getTemaEstadoStats, 
  getIngresosPorDiaPorMes, 
  getEstadoRutaPorMesYTema, 
  getCantidadTemasPorEstado,
  getResumenTotalStats,
  getTemas,
  getResumenStats,
  getCodigosSubsecretaria,
  getRegistrosAbiertos,
  getResumenTotalPendientes,
  getFilePqrsReports,
  getTemasBySubsecretaria,
  getEstadisticasPqrsPorMesYTema,
  getEstadisticasSubsecretarias
} = require('../controllers/dataController');

router.get('/', getDataStats);

// ✅ Nueva ruta para el resumen de tarjetas (añade esta línea)
router.get("/stats/resumen-tarjetas", getResumenStats);
router.get("/stats/resumen-total-tarjetas", getResumenTotalStats);
router.get("/stats/temas", getTemas);
router.get("/stats/codigos-subsecretaria", getCodigosSubsecretaria);
router.get("/stats/registros-abiertos", getRegistrosAbiertos);
router.get("/stats/resumen-total-pendientes", getResumenTotalPendientes)
router.get('/stats/estadisticas-pqrs-por-mes-y-tema', getEstadisticasPqrsPorMesYTema);
router.get('/stats/estadisticas-subsecretarias', getEstadisticasSubsecretarias)

router.get('/stats/files-reports', getFilePqrsReports);
router.get('/stats/temas-by-subsecretaria', getTemasBySubsecretaria);

// ✅ Nueva ruta: estadísticas por estado y mes
router.get("/stats/estado-mes", getEstadoMesStats);

// nueva ruta oportunidad
router.get("/stats/oportunidad-dia", getOportunidadPorDia);

// nueva ruta por tema-mes
router.get("/stats/tema-mes", getTemaMesStats);
router.get("/stats/modal-detalle", getEstadisticasEstadoParaModal);
router.get('/stats/subsecretarias', getSubsecretarias);
router.get('/stats/anios-disponibles', getAniosDisponibles);

// Nueva ruta por tema-estado
router.get('/stats/tema-estado', getTemaEstadoStats);   

// nueva ruta por mes-fecha de ingreso (cantidad)
router.get('/stats/ingresos-dia-mes', getIngresosPorDiaPorMes);

// nueva ruta - ultimo estado en ruta por mes y tema
router.get("/stats/estado-ruta-tema-mes", getEstadoRutaPorMesYTema);

// nueva ruta - cantidad de temas por estado
router.get("/stats/cantidad-temas-por-estado", getCantidadTemasPorEstado);

module.exports = router;
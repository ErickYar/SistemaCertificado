const { Router } = require('express');
const authRoutes        = require('./auth.routes');
const catalogosRoutes   = require('./catalogos.routes');
const clienteRoutes     = require('./cliente.routes');
const vehiculoRoutes    = require('./vehiculo.routes');
const certificadoRoutes = require('./certificado.routes');
const pagoRoutes        = require('./pago.routes');
const reporteRoutes     = require('./reporte.routes');
const auditoriaRoutes   = require('./auditoria.routes');   // ← NUEVO

const router = Router();

router.use('/auth',         authRoutes);
router.use('/catalogos',    catalogosRoutes);
router.use('/clientes',     clienteRoutes);
router.use('/vehiculos',    vehiculoRoutes);
router.use('/certificados', certificadoRoutes);
router.use('/pagos',        pagoRoutes);
router.use('/reportes',     reporteRoutes);
router.use('/auditoria',    auditoriaRoutes);              // ← NUEVO

module.exports = router;
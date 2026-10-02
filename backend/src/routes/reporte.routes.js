const { Router } = require('express');
const ctrl = require('../controllers/reporte.controller');
const { requiereAuth } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requiereAuth);

router.get('/dia',       ctrl.dia);        // ?fecha=YYYY-MM-DD
router.get('/semana',    ctrl.semana);     // ?fecha=YYYY-MM-DD
router.get('/mes',       ctrl.mes);        // ?anioMes=YYYY-MM
router.get('/completo',  ctrl.completo);
router.get('/mensaje',   ctrl.generarMensaje);
router.get('/historial', ctrl.historial);
router.get('/probar-telegram', ctrl.probarTelegram);

module.exports = router;
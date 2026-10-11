const { Router } = require('express');
const ctrl = require('../controllers/auditoria.controller');
const { requiereAuth, requiereAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requiereAuth);
router.use(requiereAdmin);   // Solo ADMIN puede ver auditoría

router.get('/',                       ctrl.listar);      // ?tabla=cliente&accion=ELIMINAR
router.get('/resumen',                ctrl.resumen);
router.get('/:tabla/:idRegistro',     ctrl.historial);

module.exports = router;
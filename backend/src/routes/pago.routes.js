const { Router } = require('express');
const ctrl = require('../controllers/pago.controller');
const { requiereAuth, requiereAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requiereAuth);

router.get('/',           ctrl.listar);
router.get('/:id',        ctrl.obtener);
router.post('/',          ctrl.crear);
router.patch('/:id/pagar', ctrl.marcarPagado);
router.delete('/:id',     requiereAdmin, ctrl.eliminar);

module.exports = router;
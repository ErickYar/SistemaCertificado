const { Router } = require('express');
const ctrl = require('../controllers/vehiculo.controller');
const { requiereAuth, requiereAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requiereAuth);

router.get('/',        ctrl.listar);
router.get('/buscar',  ctrl.buscar);        // ?placa= o ?vin=
router.get('/:id',     ctrl.obtener);
router.post('/',       ctrl.crear);
router.put('/:id',     ctrl.actualizar);
router.delete('/:id',  requiereAdmin, ctrl.eliminar);

module.exports = router;
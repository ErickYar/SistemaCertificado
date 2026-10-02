const { Router } = require('express');
const ctrl = require('../controllers/certificado.controller');
const { requiereAuth, requiereAdmin } = require('../middlewares/auth.middleware');

const router = Router();

router.use(requiereAuth);

router.get('/',        ctrl.listar);
router.get('/buscar',  ctrl.buscar);        // ?numero= ?control= ?placa= ?tipo= ?estado=
router.get('/:id',     ctrl.obtener);
router.post('/',       ctrl.crear);
router.patch('/:id/estado', ctrl.actualizarEstado);
router.delete('/:id',  requiereAdmin, ctrl.eliminar);

module.exports = router;
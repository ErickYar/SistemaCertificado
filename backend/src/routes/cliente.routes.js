const { Router } = require('express');
const ctrl = require('../controllers/cliente.controller');
const { requiereAuth, requiereAdmin } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas requieren login
router.use(requiereAuth);

router.get('/',        ctrl.listar);
router.get('/buscar',  ctrl.buscar);       // ?documento= o ?nombre=
router.get('/:id',     ctrl.obtener);
router.post('/',       ctrl.crear);
router.put('/:id',     ctrl.actualizar);
router.delete('/:id',  requiereAdmin, ctrl.eliminar);   // solo ADMIN

module.exports = router;
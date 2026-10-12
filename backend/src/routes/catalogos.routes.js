const { Router } = require('express');
const ctrl = require('../controllers/catalogos.controller');
const { requiereAuth } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas de catálogos requieren login
router.use(requiereAuth);

router.get('/categorias',                                ctrl.getCategorias);
router.get('/marcas',                                    ctrl.getMarcas);
router.get('/marcas/:idMarca/modelos',                   ctrl.getModelosPorMarca);
router.get('/colores',                                   ctrl.getColores);
router.get('/carrocerias',                               ctrl.getCarrocerias);
router.get('/tipos-uso',                                 ctrl.getTiposUso);
router.get('/formas-rodamiento',                         ctrl.getFormasRodamiento);
router.get('/condiciones',                               ctrl.getCondiciones);
router.get('/combustibles',                              ctrl.getCombustibles);
router.get('/zonas-registrales',                         ctrl.getZonasRegistrales);
router.get('/zonas-registrales/:codZona/sedes',          ctrl.getSedesPorZona);
router.get('/tipos-suspension',                          ctrl.getTiposSuspension);
router.get('/clases-neumatico',                          ctrl.getClasesNeumatico);
router.get('/departamentos',                             ctrl.getDepartamentos);
router.get('/departamentos/:idDepartamento/provincias',  ctrl.getProvincias);
router.get('/provincias/:idProvincia/distritos',         ctrl.getDistritos);
router.post('/marcas',                                   ctrl.crearMarca);
router.post('/marcas/:idMarca/modelos',                  ctrl.crearModelo);
router.get('/emisores',                                  ctrl.getEmisores);
module.exports = router;
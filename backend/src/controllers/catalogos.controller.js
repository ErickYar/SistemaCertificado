const catalogos = require('../services/catalogos.service');

const responder = async (res, fn) => {
    try {
        const data = await fn();
        res.json(data);
    } catch (err) {
        res.status(500).json({ mensaje: err.message });
    }
};

const getCategorias       = (_req, res) => responder(res, () => catalogos.listarCategorias());
const getMarcas           = (_req, res) => responder(res, () => catalogos.listarMarcas());
const getModelosPorMarca  = (req, res)  => responder(res, () => catalogos.listarModelosPorMarca(Number(req.params.idMarca)));
const getColores          = (_req, res) => responder(res, () => catalogos.listarColores());
const getCarrocerias      = (req, res)  => responder(res, () => catalogos.listarCarrocerias(req.query.categoria));
const getTiposUso         = (_req, res) => responder(res, () => catalogos.listarTiposUso());
const getFormasRodamiento = (_req, res) => responder(res, () => catalogos.listarFormasRodamiento());
const getCondiciones      = (_req, res) => responder(res, () => catalogos.listarCondiciones());
const getCombustibles     = (_req, res) => responder(res, () => catalogos.listarCombustibles());
const getZonasRegistrales = (_req, res) => responder(res, () => catalogos.listarZonasRegistrales());
const getSedesPorZona     = (req, res)  => responder(res, () => catalogos.listarSedesPorZona(req.params.codZona));
const getTiposSuspension  = (_req, res) => responder(res, () => catalogos.listarTiposSuspension());
const getClasesNeumatico  = (_req, res) => responder(res, () => catalogos.listarClasesNeumatico());
const getDepartamentos    = (_req, res) => responder(res, () => catalogos.listarDepartamentos());
const getProvincias       = (req, res)  => responder(res, () => catalogos.listarProvinciasPorDepartamento(Number(req.params.idDepartamento)));
const getDistritos        = (req, res)  => responder(res, () => catalogos.listarDistritosPorProvincia(Number(req.params.idProvincia)));
const getEmisores         = (_req, res) => responder(res, () => catalogos.listarEmisores());
const crearMarca = async (req, res) => {
    try {
        const { nombre } = req.body;
        const marca = await catalogos.crearMarca(nombre);
        res.status(201).json(marca);
    } catch (err) {
        res.status(400).json({ mensaje: err.message });
    }
};

const crearModelo = async (req, res) => {
    try {
        const { idMarca } = req.params;
        const { nombre } = req.body;
        const modelo = await catalogos.crearModelo(Number(idMarca), nombre);
        res.status(201).json(modelo);
    } catch (err) {
        res.status(400).json({ mensaje: err.message });
    }
};
module.exports = {
    getCategorias,
    getMarcas,
    getModelosPorMarca,
    getColores,
    getCarrocerias,
    getTiposUso,
    getFormasRodamiento,
    getCondiciones,
    getCombustibles,
    getZonasRegistrales,
    getSedesPorZona,
    getTiposSuspension,
    getClasesNeumatico,
    getDepartamentos,
    getProvincias,
    getDistritos,
    crearMarca,
    getEmisores,
    crearModelo
};
const svc = require('../services/auditoria.service');

async function listar(req, res) {
    try {
        const filtros = {
            tabla:      req.query.tabla,
            accion:     req.query.accion,
            id_usuario: req.query.id_usuario,
            desde:      req.query.desde,
            hasta:      req.query.hasta,
            busqueda:   req.query.busqueda,
            limite:     req.query.limite ? Number(req.query.limite) : 200
        };
        return res.json(await svc.listar(filtros));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function historial(req, res) {
    try {
        const { tabla, idRegistro } = req.params;
        return res.json(await svc.historial(tabla, Number(idRegistro)));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function resumen(_req, res) {
    try {
        return res.json(await svc.resumen());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

module.exports = { listar, historial, resumen };
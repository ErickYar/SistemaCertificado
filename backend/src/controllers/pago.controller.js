const svc = require('../services/pago.service');

async function listar(req, res) {
    try {
        const filtros = {
            pagado: req.query.pagado !== undefined ? req.query.pagado === 'true' : undefined,
            desde:  req.query.desde,
            hasta:  req.query.hasta
        };
        return res.json(await svc.listarPagos(filtros));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function obtener(req, res) {
    try {
        const pago = await svc.obtenerPorId(Number(req.params.id));
        if (!pago) return res.status(404).json({ mensaje: 'Pago no encontrado' });
        return res.json(pago);
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function crear(req, res) {
    try {
        const resultado = await svc.crearPago(req.body);
        return res.status(201).json({
            ...resultado,
            mensaje: 'Pago registrado correctamente'
        });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function marcarPagado(req, res) {
    try {
        await svc.marcarPagado(Number(req.params.id), req.body);
        return res.json({ mensaje: 'Pago confirmado correctamente' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function eliminar(req, res) {
    try {
        await svc.eliminarPago(Number(req.params.id));
        return res.json({ mensaje: 'Pago desactivado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

module.exports = { listar, obtener, crear, marcarPagado, eliminar };
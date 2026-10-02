const svc = require('../services/vehiculo.service');

async function listar(_req, res) {
    try {
        return res.json(await svc.listarVehiculos());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function obtener(req, res) {
    try {
        const v = await svc.obtenerPorId(Number(req.params.id));
        if (!v) return res.status(404).json({ mensaje: 'Vehículo no encontrado' });
        return res.json(v);
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function buscar(req, res) {
    try {
        const placa = String(req.query.placa || '').trim();
        const vin   = String(req.query.vin   || '').trim();

        if (placa) return res.json(await svc.buscarPorPlaca(placa));
        if (vin)   return res.json(await svc.buscarPorVin(vin));

        return res.status(400).json({ mensaje: 'Envíe ?placa= o ?vin=' });
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function crear(req, res) {
    try {
        const id = await svc.crearVehiculo(req.body);
        return res.status(201).json({
            id_vehiculo: id,
            mensaje: 'Vehículo creado correctamente'
        });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function actualizar(req, res) {
    try {
        await svc.actualizarVehiculo(Number(req.params.id), req.body);
        return res.json({ mensaje: 'Vehículo actualizado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function eliminar(req, res) {
    try {
        await svc.eliminarVehiculo(Number(req.params.id));
        return res.json({ mensaje: 'Vehículo desactivado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

module.exports = { listar, obtener, buscar, crear, actualizar, eliminar };
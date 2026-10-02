const svc = require('../services/cliente.service');

async function buscar(req, res) {
    try {
        const documento = String(req.query.documento || '').trim();
        const nombre    = String(req.query.nombre    || '').trim();

        if (documento) {
            const cliente = await svc.buscarPorDocumento(documento);
            return res.json(cliente);
        }

        if (nombre) {
            const lista = await svc.buscarPorNombre(nombre);
            return res.json(lista);
        }

        return res.status(400).json({ mensaje: 'Envíe ?documento= o ?nombre=' });
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function obtener(req, res) {
    try {
        const cliente = await svc.obtenerPorId(Number(req.params.id));
        if (!cliente) return res.status(404).json({ mensaje: 'No encontrado' });
        return res.json(cliente);
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function listar(_req, res) {
    try {
        return res.json(await svc.listarClientes());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function crear(req, res) {
    try {
        const id = await svc.crearCliente(req.body);
        return res.status(201).json({ id_cliente: id, mensaje: 'Cliente creado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function actualizar(req, res) {
    try {
        await svc.actualizarCliente(Number(req.params.id), req.body);
        return res.json({ mensaje: 'Cliente actualizado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function eliminar(req, res) {
    try {
        await svc.eliminarCliente(Number(req.params.id));
        return res.json({ mensaje: 'Cliente desactivado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

module.exports = { buscar, obtener, listar, crear, actualizar, eliminar };
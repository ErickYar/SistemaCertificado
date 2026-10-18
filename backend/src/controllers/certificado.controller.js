const svc = require('../services/certificado.service');

async function listar(_req, res) {
    try {
        return res.json(await svc.listarCertificados());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function obtener(req, res) {
    try {
        const cert = await svc.obtenerPorId(Number(req.params.id));
        if (!cert) return res.status(404).json({ mensaje: 'Certificado no encontrado' });
        return res.json(cert);
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function buscar(req, res) {
    try {
        const { numero, control, placa, tipo, estado } = req.query;

        if (!numero && !control && !placa && !tipo && !estado) {
            return res.status(400).json({
                mensaje: 'Envíe al menos un filtro: ?numero=, ?control=, ?placa=, ?tipo= o ?estado='
            });
        }

        return res.json(await svc.buscarCertificados({ numero, control, placa, tipo, estado }));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function crear(req, res) {
    try {
        const resultado = await svc.crearCertificado(req.body);
        return res.status(201).json({
            ...resultado,
            mensaje: 'Certificado creado correctamente'
        });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

async function actualizarEstado(req, res) {
    try {
        const { estado, datosPago } = req.body;
        if (!estado) return res.status(400).json({ mensaje: 'Falta el campo "estado"' });

        // Pasar el usuario logueado si existe
        if (datosPago) {
            datosPago.registrado_por = req.usuario?.nombre_usuario || 'admin';
        }

        await svc.actualizarEstado(Number(req.params.id), estado, datosPago);
        return res.json({ mensaje: 'Estado actualizado a ' + estado });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}



async function eliminar(req, res) {
    try {
        await svc.eliminarCertificado(Number(req.params.id));
        return res.json({ mensaje: 'Certificado desactivado' });
    } catch (err) {
        return res.status(400).json({ mensaje: err.message });
    }
}

module.exports = { listar, obtener, buscar, crear, actualizarEstado, eliminar };
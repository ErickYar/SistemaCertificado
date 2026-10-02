const svc = require('../services/reporte.service');

async function dia(req, res) {
    try {
        return res.json(await svc.totalesDelDia(req.query.fecha));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function semana(req, res) {
    try {
        return res.json(await svc.totalesDeLaSemana(req.query.fecha));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function mes(req, res) {
    try {
        return res.json(await svc.totalesDelMes(req.query.anioMes));
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function completo(_req, res) {
    try {
        return res.json(await svc.reporteCompleto());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function generarMensaje(_req, res) {
    try {
        return res.json(await svc.generarMensaje());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}

async function historial(_req, res) {
    try {
        return res.json(await svc.listarHistorial());
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}
async function probarTelegram(_req, res) {
    try {
        const scheduler = require('../utils/scheduler');
        await scheduler.ejecutarEnvio('DIARIO');
        return res.json({ mensaje: 'Reporte enviado (revisa el log)' });
    } catch (err) {
        return res.status(500).json({ mensaje: err.message });
    }
}


module.exports = { dia, semana, mes, completo, generarMensaje, historial, probarTelegram };

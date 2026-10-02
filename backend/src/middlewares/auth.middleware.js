const { verificarToken } = require('../utils/jwt');

function requiereAuth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    try {
        const token = header.split(' ')[1];
        req.usuario = verificarToken(token);
        next();
    } catch {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
}

function requiereAdmin(req, res, next) {
    if (req.usuario?.rol !== 'ADMIN') {
        return res.status(403).json({ mensaje: 'Requiere rol ADMIN' });
    }
    next();
}

module.exports = { requiereAuth, requiereAdmin };
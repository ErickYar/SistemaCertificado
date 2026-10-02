const authService = require('../services/auth.service');

async function loginController(req, res) {
    try {
        const { nombre_usuario, password } = req.body;

        if (!nombre_usuario || !password) {
            return res.status(400).json({ mensaje: 'Faltan credenciales' });
        }

        const resultado = await authService.login(nombre_usuario, password);
        return res.json(resultado);

    } catch (err) {
        return res.status(401).json({ mensaje: err.message });
    }
}

module.exports = { loginController };
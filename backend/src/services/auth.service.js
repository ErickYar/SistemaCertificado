const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { firmarToken } = require('../utils/jwt');

async function login(nombre_usuario, password) {
    const [rows] = await pool.query(
        `SELECT id_usuario, nombre_usuario, password_hash,
                nombre_completo, rol, activo
         FROM usuario
         WHERE nombre_usuario = ? AND activo = 1
         LIMIT 1`,
        [nombre_usuario]
    );

    if (rows.length === 0) {
        throw new Error('Usuario o contraseña incorrectos');
    }

    const usuario = rows[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);

    if (!coincide) {
        throw new Error('Usuario o contraseña incorrectos');
    }

    const token = firmarToken({
        id_usuario:     usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        rol:            usuario.rol
    });

    return {
        token,
        usuario: {
            id:              usuario.id_usuario,
            nombre_usuario:  usuario.nombre_usuario,
            nombre_completo: usuario.nombre_completo,
            rol:             usuario.rol
        }
    };
}

module.exports = { login };
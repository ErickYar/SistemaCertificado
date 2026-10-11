const { pool } = require('../config/database');

// ============================================================
// REGISTRAR UNA ACCIÓN
// ============================================================
async function registrar({
    tabla,
    id_registro,
    accion,
    usuario,
    datosAnteriores = null,
    datosNuevos = null,
    descripcion = null
}) {
    try {
        await pool.query(
            `INSERT INTO auditoria
             (tabla, id_registro, accion, id_usuario, nombre_usuario,
              datos_anteriores, datos_nuevos, descripcion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tabla,
                id_registro,
                accion,
                usuario?.id_usuario     || null,
                usuario?.nombre_usuario || null,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos     ? JSON.stringify(datosNuevos)     : null,
                descripcion
            ]
        );
    } catch (err) {
        console.error('❌ Error al registrar auditoría:', err.message);
        // No lanzamos el error para no romper la operación principal
    }
}

// ============================================================
// LISTAR AUDITORÍA CON FILTROS
// ============================================================
async function listar(filtros = {}) {
    const condiciones = [];
    const valores = [];

    if (filtros.tabla) {
        condiciones.push('tabla = ?');
        valores.push(filtros.tabla);
    }
    if (filtros.accion) {
        condiciones.push('accion = ?');
        valores.push(filtros.accion);
    }
    if (filtros.id_usuario) {
        condiciones.push('id_usuario = ?');
        valores.push(filtros.id_usuario);
    }
    if (filtros.desde) {
        condiciones.push('DATE(fecha) >= ?');
        valores.push(filtros.desde);
    }
    if (filtros.hasta) {
        condiciones.push('DATE(fecha) <= ?');
        valores.push(filtros.hasta);
    }
    if (filtros.busqueda) {
        condiciones.push('(descripcion LIKE ? OR nombre_usuario LIKE ? OR id_registro = ?)');
        valores.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, Number(filtros.busqueda) || 0);
    }

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const limite = filtros.limite || 200;

    const [rows] = await pool.query(
        `SELECT * FROM auditoria
         ${where}
         ORDER BY fecha DESC
         LIMIT ?`,
        [...valores, limite]
    );

    return rows;
}

// ============================================================
// HISTORIAL DE UN REGISTRO ESPECÍFICO
// ============================================================
async function historial(tabla, idRegistro) {
    const [rows] = await pool.query(
        `SELECT * FROM auditoria
         WHERE tabla = ? AND id_registro = ?
         ORDER BY fecha DESC`,
        [tabla, idRegistro]
    );
    return rows;
}

// ============================================================
// RESUMEN DE ACTIVIDAD
// ============================================================
async function resumen() {
    const [porAccion] = await pool.query(
        `SELECT accion, COUNT(*) AS cantidad
         FROM auditoria
         WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY accion`
    );

    const [porUsuario] = await pool.query(
        `SELECT nombre_usuario, COUNT(*) AS cantidad
         FROM auditoria
         WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY nombre_usuario
         ORDER BY cantidad DESC
         LIMIT 10`
    );

    return { porAccion, porUsuario };
}

module.exports = {
    registrar,
    listar,
    historial,
    resumen
};
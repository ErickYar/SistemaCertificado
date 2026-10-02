const { pool } = require('../config/database');

// ============================================================
// CREAR PAGO (con vinculación de certificados)
// ============================================================
async function crearPago(data) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Validaciones
        if (!data.id_cliente) throw new Error('id_cliente es obligatorio');
        if (!data.concepto)   throw new Error('El concepto es obligatorio');
        if (!data.monto || data.monto <= 0) throw new Error('El monto debe ser mayor a 0');

        // 2. Verificar cliente
        const [cli] = await conn.query(
            `SELECT id_cliente FROM cliente WHERE id_cliente = ? AND activo = 1`,
            [data.id_cliente]
        );
        if (cli.length === 0) throw new Error('El cliente no existe o está inactivo');

        // 3. Reglas de pago
        const pagado = data.pagado ? 1 : 0;
        const medioPago = pagado ? data.medio_pago : null;
        const fechaPago = pagado ? (data.fecha_pago || new Date()) : null;

        if (pagado && !medioPago) {
            throw new Error('Si el pago está marcado como PAGADO debe indicar medio_pago');
        }

        // 4. Validar número de transacción duplicado (solo aviso, no bloquea)
        let advertencia = null;
        if (pagado && data.nro_transaccion) {
            const [dup] = await conn.query(
                `SELECT id_pago, fecha_pago, monto
                 FROM pago
                 WHERE nro_transaccion = ? AND activo = 1
                 LIMIT 1`,
                [data.nro_transaccion]
            );
            if (dup.length > 0) {
                advertencia = {
                    mensaje: 'El número de transacción ya existe',
                    id_pago_existente: dup[0].id_pago,
                    fecha_pago_original: dup[0].fecha_pago,
                    monto_original: dup[0].monto
                };
            }
        }

        // 5. Insertar pago
        const [res] = await conn.query(
            `INSERT INTO pago (
                id_cliente, concepto, monto, pagado, fecha_pago,
                medio_pago, numero_operacion, entidad_bancaria,
                numero_voucher, registrado_por, nro_transaccion,
                observaciones
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_cliente,
                data.concepto,
                data.monto,
                pagado,
                fechaPago,
                medioPago,
                data.numero_operacion || null,
                data.entidad_bancaria || null,
                data.numero_voucher   || null,
                data.registrado_por   || null,
                data.nro_transaccion  || null,
                data.observaciones    || null
            ]
        );

        const idPago = res.insertId;

        // 6. Vincular certificados
        if (data.certificados && Array.isArray(data.certificados) && data.certificados.length > 0) {
            for (const idCert of data.certificados) {
                // Verificar que el certificado existe
                const [cert] = await conn.query(
                    `SELECT id_certificado FROM certificado WHERE id_certificado = ? AND activo = 1`,
                    [idCert]
                );
                if (cert.length === 0) {
                    throw new Error(`El certificado ${idCert} no existe`);
                }

                await conn.query(
                    `INSERT INTO pago_certificado (id_pago, id_certificado) VALUES (?, ?)`,
                    [idPago, idCert]
                );

                // Si el pago está pagado, actualizar estado del certificado
                if (pagado) {
                    await conn.query(
                        `UPDATE certificado SET estado = 'PAGADO'
                         WHERE id_certificado = ? AND estado != 'ANULADO'`,
                        [idCert]
                    );
                }
            }
        }

        await conn.commit();

        return {
            id_pago: idPago,
            advertencia
        };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ============================================================
// OBTENER PAGO CON CERTIFICADOS VINCULADOS
// ============================================================
async function obtenerPorId(id) {
    const [rows] = await pool.query(
        `SELECT p.*,
                c.tipo_persona, c.razon_social, c.nombres, c.apellidos, c.dni, c.ruc
         FROM pago p
         LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
         WHERE p.id_pago = ? AND p.activo = 1
         LIMIT 1`,
        [id]
    );

    if (rows.length === 0) return null;

    const pago = rows[0];

    const [certificados] = await pool.query(
        `SELECT c.id_certificado, c.tipo_certificado, c.numero_certificado,
                c.codigo_control, c.estado,
                v.placa
         FROM pago_certificado pc
         JOIN certificado c ON c.id_certificado = pc.id_certificado
         LEFT JOIN vehiculo v ON v.id_vehiculo = c.id_vehiculo
         WHERE pc.id_pago = ?`,
        [id]
    );

    pago.certificados = certificados;
    return pago;
}

// ============================================================
// LISTAR PAGOS
// ============================================================
async function listarPagos(filtros = {}) {
    const condiciones = ['p.activo = 1'];
    const valores = [];

    if (filtros.pagado !== undefined) {
        condiciones.push('p.pagado = ?');
        valores.push(filtros.pagado ? 1 : 0);
    }
    if (filtros.desde) {
        condiciones.push('DATE(p.fecha_registro) >= ?');
        valores.push(filtros.desde);
    }
    if (filtros.hasta) {
        condiciones.push('DATE(p.fecha_registro) <= ?');
        valores.push(filtros.hasta);
    }

    const [rows] = await pool.query(
        `SELECT p.*,
                c.tipo_persona, c.razon_social, c.nombres, c.apellidos, c.dni, c.ruc
         FROM pago p
         LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
         WHERE ${condiciones.join(' AND ')}
         ORDER BY p.fecha_registro DESC
         LIMIT 200`,
        valores
    );
    return rows;
}

// ============================================================
// MARCAR COMO PAGADO
// ============================================================
async function marcarPagado(id, datos) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        if (!datos.medio_pago) throw new Error('El medio de pago es obligatorio');

        const [res] = await conn.query(
            `UPDATE pago
             SET pagado = 1,
                 fecha_pago = ?,
                 medio_pago = ?,
                 numero_operacion = ?,
                 entidad_bancaria = ?,
                 numero_voucher = ?,
                 nro_transaccion = ?,
                 registrado_por = ?
             WHERE id_pago = ? AND activo = 1`,
            [
                datos.fecha_pago || new Date(),
                datos.medio_pago,
                datos.numero_operacion || null,
                datos.entidad_bancaria || null,
                datos.numero_voucher   || null,
                datos.nro_transaccion  || null,
                datos.registrado_por   || null,
                id
            ]
        );

        if (res.affectedRows === 0) throw new Error('Pago no encontrado');

        // Actualizar certificados vinculados
        await conn.query(
            `UPDATE certificado c
             JOIN pago_certificado pc ON pc.id_certificado = c.id_certificado
             SET c.estado = 'PAGADO'
             WHERE pc.id_pago = ? AND c.estado != 'ANULADO'`,
            [id]
        );

        await conn.commit();
        return true;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ============================================================
// ELIMINAR (lógico)
// ============================================================
async function eliminarPago(id) {
    const [res] = await pool.query(
        `UPDATE pago SET activo = 0 WHERE id_pago = ?`,
        [id]
    );
    if (res.affectedRows === 0) throw new Error('Pago no encontrado');
}

module.exports = {
    crearPago,
    obtenerPorId,
    listarPagos,
    marcarPagado,
    eliminarPago
};
const { pool } = require('../config/database');

// ============================================================
// CORRELATIVOS Y GENERACIÓN DE NÚMEROS
// ============================================================

async function generarNumeroCertificado(conn, tipo, anio) {
    // Bloquear fila para evitar duplicados
    const [rows] = await conn.query(
        `SELECT ultimo_numero FROM correlativo_certificado
         WHERE tipo_certificado = ? AND anio = ?
         FOR UPDATE`,
        [tipo, anio]
    );

    let siguiente = 1;
    if (rows.length > 0) {
        siguiente = rows[0].ultimo_numero + 1;
        await conn.query(
            `UPDATE correlativo_certificado
             SET ultimo_numero = ?
             WHERE tipo_certificado = ? AND anio = ?`,
            [siguiente, tipo, anio]
        );
    } else {
        await conn.query(
            `INSERT INTO correlativo_certificado
             (tipo_certificado, anio, ultimo_numero)
             VALUES (?, ?, ?)`,
            [tipo, anio, siguiente]
        );
    }

    const anioCorto = String(anio).slice(-2);         // '26'
    const numeroStr = String(siguiente).padStart(6, '0'); // '000457'
    return `${anioCorto} ${numeroStr}`;                // '26 000457'
}

async function generarCodigoControl(conn) {
    const anio = new Date().getFullYear();

    const [rows] = await conn.query(
        `SELECT ultimo_numero FROM correlativo_certificado
         WHERE tipo_certificado = 'CONTROL' AND anio = ?
         FOR UPDATE`,
        [anio]
    );

    let siguiente = 1;
    if (rows.length > 0) {
        siguiente = rows[0].ultimo_numero + 1;
        await conn.query(
            `UPDATE correlativo_certificado
             SET ultimo_numero = ?
             WHERE tipo_certificado = 'CONTROL' AND anio = ?`,
            [siguiente, anio]
        );
    } else {
        await conn.query(
            `INSERT INTO correlativo_certificado
             (tipo_certificado, anio, ultimo_numero)
             VALUES ('CONTROL', ?, ?)`,
            [anio, siguiente]
        );
    }

    const numeroStr = String(siguiente).padStart(6, '0');
    return `SA-50-${numeroStr}`;                       // 'SA-50-000686'
}

// ============================================================
// CREAR CERTIFICADO (padre + hija + observaciones)
// ============================================================

async function crearCertificado(data) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Validaciones
        if (!data.tipo_certificado) throw new Error('tipo_certificado es obligatorio');
        if (!data.id_vehiculo)      throw new Error('id_vehiculo es obligatorio');
        if (!data.id_cliente)       throw new Error('id_cliente es obligatorio');
        if (!data.id_emisor)        throw new Error('id_emisor es obligatorio');

        const tiposValidos = ['MODIFICACION', 'MONTAJE', 'FABRICACION', 'BONIFICACION'];
        if (!tiposValidos.includes(data.tipo_certificado)) {
            throw new Error(`tipo_certificado debe ser uno de: ${tiposValidos.join(', ')}`);
        }

        // 2. Verificar que el vehículo y cliente existan
        const [veh] = await conn.query(
            `SELECT id_vehiculo FROM vehiculo WHERE id_vehiculo = ? AND activo = 1`,
            [data.id_vehiculo]
        );
        if (veh.length === 0) throw new Error('El vehículo no existe o está inactivo');

        const [cli] = await conn.query(
            `SELECT id_cliente FROM cliente WHERE id_cliente = ? AND activo = 1`,
            [data.id_cliente]
        );
        if (cli.length === 0) throw new Error('El cliente no existe o está inactivo');

        // 3. Generar número y código de control
        const anio = new Date().getFullYear();
        const numeroCertificado = data.numero_certificado
            || await generarNumeroCertificado(conn, data.tipo_certificado, anio);

        const codigoControl = data.codigo_control
            || await generarCodigoControl(conn);

        // 4. Insertar el certificado padre
        const [resCert] = await conn.query(
            `INSERT INTO certificado (
                tipo_certificado, numero_certificado, codigo_control,
                id_vehiculo, id_cliente, id_emisor,
                estado, observaciones
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.tipo_certificado,
                numeroCertificado,
                codigoControl,
                data.id_vehiculo,
                data.id_cliente,
                data.id_emisor,
                data.estado || 'BORRADOR',
                data.observaciones_generales || null
            ]
        );

        const idCert = resCert.insertId;

        // 5. Insertar hija según tipo
        if (data.tipo_certificado === 'MODIFICACION') {
            await insertarModificacion(conn, idCert, data);
        } else if (data.tipo_certificado === 'BONIFICACION') {
            await insertarBonificacion(conn, idCert, data, numeroCertificado, codigoControl);
        } else if (data.tipo_certificado === 'MONTAJE') {
            await insertarMontaje(conn, idCert, data);
        } else if (data.tipo_certificado === 'FABRICACION') {
            await insertarFabricacion(conn, idCert, data);
        }

        // 6. Insertar observaciones numeradas
        if (data.observaciones && Array.isArray(data.observaciones)) {
            for (let i = 0; i < data.observaciones.length; i++) {
                await conn.query(
                    `INSERT INTO certificado_observacion
                     (id_certificado, orden, texto)
                     VALUES (?, ?, ?)`,
                    [idCert, i + 1, data.observaciones[i]]
                );
            }
        }

        await conn.commit();

        return {
            id_certificado: idCert,
            numero_certificado: numeroCertificado,
            codigo_control: codigoControl
        };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ============================================================
// HIJAS
// ============================================================

async function insertarModificacion(conn, idCert, data) {
    if (!data.modificaciones || !Array.isArray(data.modificaciones)) {
        throw new Error('Debe enviar el array "modificaciones" con al menos un cambio');
    }

    for (const m of data.modificaciones) {
        if (!m.campo_modificado) {
            throw new Error('Cada modificación requiere "campo_modificado"');
        }
        await conn.query(
            `INSERT INTO certificado_modificacion
             (id_certificado, campo_modificado, valor_anterior, valor_nuevo, observaciones)
             VALUES (?, ?, ?, ?, ?)`,
            [
                idCert,
                m.campo_modificado,
                m.valor_anterior || null,
                m.valor_nuevo    || null,
                m.observaciones  || null
            ]
        );
    }
}

async function insertarBonificacion(conn, idCert, data, numero, codigo) {
    const b = data.bonificacion;
    if (!b) throw new Error('Debe enviar el objeto "bonificacion"');

    await conn.query(
        `INSERT INTO certificado_bonificacion (
            id_certificado, numero_certificado, codigo_control,
            categoria, vin_serie, marca, modelo, anio_modelo,
            numero_motor, numero_ejes, numero_ruedas,
            distancia_ejes_m, distancia_kingpin_m,
            ciudad_emision, fecha_emision_doc, observaciones
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            idCert, numero, codigo,
            b.categoria        || null,
            b.vin_serie        || null,
            b.marca            || null,
            b.modelo           || null,
            b.anio_modelo      || null,
            b.numero_motor     || null,
            b.numero_ejes      || null,
            b.numero_ruedas    || null,
            b.distancia_ejes_m || null,
            b.distancia_kingpin_m || null,
            b.ciudad_emision   || null,
            b.fecha_emision_doc|| null,
            b.observaciones    || null
        ]
    );

    if (b.ejes && Array.isArray(b.ejes)) {
        for (const e of b.ejes) {
            await conn.query(
                `INSERT INTO certificado_bonificacion_eje (
                    id_certificado, orden, tipo_rodada, cod_tipo_suspension,
                    capacidad_eje_kg, capacidad_suspension_kg, capacidad_neumatico_kg,
                    medida_aro, medida_neumatico, cod_clase_neumatico
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idCert,
                    e.orden,
                    e.tipo_rodada        || null,
                    e.cod_tipo_suspension|| null,
                    e.capacidad_eje_kg   || null,
                    e.capacidad_suspension_kg || null,
                    e.capacidad_neumatico_kg  || null,
                    e.medida_aro         || null,
                    e.medida_neumatico   || null,
                    e.cod_clase_neumatico|| null
                ]
            );
        }
    }
}

async function insertarMontaje(conn, idCert, data) {
    await conn.query(
        `INSERT INTO certificado_montaje (id_certificado, datos) VALUES (?, ?)`,
        [idCert, JSON.stringify(data.montaje || {})]
    );
}

async function insertarFabricacion(conn, idCert, data) {
    await conn.query(
        `INSERT INTO certificado_fabricacion (id_certificado, datos) VALUES (?, ?)`,
        [idCert, JSON.stringify(data.fabricacion || {})]
    );
}

// ============================================================
// OBTENER CERTIFICADO COMPLETO
// ============================================================

async function obtenerPorId(id) {
    const [rows] = await pool.query(
        `SELECT c.*,
                v.placa, v.numero_vin, v.numero_serie,
                v.id_categoria, v.id_marca, v.id_modelo, v.anio_modelo,
                ma.nombre AS marca, mo.nombre AS modelo,
                cc.descripcion AS categoria_desc, cc.destino AS categoria_destino,
                cl.tipo_persona, cl.razon_social, cl.nombres, cl.apellidos, cl.dni, cl.ruc,
                e.razon_social AS emisor, e.representante AS emisor_representante, e.colegiatura AS emisor_colegiatura
         FROM certificado c
         LEFT JOIN vehiculo v  ON v.id_vehiculo = c.id_vehiculo
         LEFT JOIN cat_marca ma ON ma.id_marca = v.id_marca
         LEFT JOIN cat_modelo mo ON mo.id_modelo = v.id_modelo
         LEFT JOIN cat_categoria cc ON cc.codigo = v.id_categoria
         LEFT JOIN cliente cl ON cl.id_cliente = c.id_cliente
         LEFT JOIN emisor_certificado e ON e.id_emisor = c.id_emisor
         WHERE c.id_certificado = ? AND c.activo = 1
         LIMIT 1`,
        [id]
    );

    if (rows.length === 0) return null;

    const cert = rows[0];

    // Observaciones numeradas
    const [obs] = await pool.query(
        `SELECT orden, texto FROM certificado_observacion
         WHERE id_certificado = ?
         ORDER BY orden`,
        [id]
    );
    cert.observaciones_numeradas = obs;

    // Hija según tipo
    if (cert.tipo_certificado === 'MODIFICACION') {
        const [mods] = await pool.query(
            `SELECT * FROM certificado_modificacion WHERE id_certificado = ?`,
            [id]
        );
        cert.modificaciones = mods;
    } else if (cert.tipo_certificado === 'BONIFICACION') {
        const [bon] = await pool.query(
            `SELECT * FROM certificado_bonificacion WHERE id_certificado = ?`,
            [id]
        );
        const [ejes] = await pool.query(
            `SELECT * FROM certificado_bonificacion_eje WHERE id_certificado = ? ORDER BY orden`,
            [id]
        );
        cert.bonificacion = bon[0] || null;
        cert.ejes = ejes;
    } else if (cert.tipo_certificado === 'MONTAJE') {
        const [m] = await pool.query(
            `SELECT datos FROM certificado_montaje WHERE id_certificado = ?`,
            [id]
        );
        cert.montaje = m[0]?.datos || null;
    } else if (cert.tipo_certificado === 'FABRICACION') {
        const [f] = await pool.query(
            `SELECT datos FROM certificado_fabricacion WHERE id_certificado = ?`,
            [id]
        );
        cert.fabricacion = f[0]?.datos || null;
    }

    return cert;
}

// ============================================================
// BÚSQUEDA
// ============================================================

async function buscarCertificados({ numero, control, placa, tipo, estado }) {
    const condiciones = ['c.activo = 1'];
    const valores = [];

    if (numero) {
        condiciones.push('c.numero_certificado LIKE ?');
        valores.push(`%${numero}%`);
    }
    if (control) {
        condiciones.push('c.codigo_control LIKE ?');
        valores.push(`%${control}%`);
    }
    if (placa) {
        condiciones.push('v.placa LIKE ?');
        valores.push(`%${placa}%`);
    }
    if (tipo) {
        condiciones.push('c.tipo_certificado = ?');
        valores.push(tipo);
    }
    if (estado) {
        condiciones.push('c.estado = ?');
        valores.push(estado);
    }

    const sql = `
        SELECT c.id_certificado, c.tipo_certificado,
               c.numero_certificado, c.codigo_control,
               c.estado, c.fecha_emision, c.observaciones,
               v.placa, v.numero_vin,
               cl.tipo_persona, cl.razon_social,
               cl.nombres, cl.apellidos, cl.dni, cl.ruc
        FROM certificado c
        JOIN vehiculo v  ON v.id_vehiculo = c.id_vehiculo
        JOIN cliente  cl ON cl.id_cliente = c.id_cliente
        WHERE ${condiciones.join(' AND ')}
        ORDER BY c.fecha_emision DESC
        LIMIT 100
    `;

    const [rows] = await pool.query(sql, valores);
    return rows;
}

// ============================================================
// LISTAR
// ============================================================

async function listarCertificados() {
    return buscarCertificados({});
}

// ============================================================
// ACTUALIZAR ESTADO
// ============================================================

async function actualizarEstado(id, estado) {
    const estadosValidos = ['BORRADOR', 'EMITIDO', 'PAGADO', 'ENTREGADO', 'ANULADO'];
    if (!estadosValidos.includes(estado)) {
        throw new Error(`estado debe ser uno de: ${estadosValidos.join(', ')}`);
    }

    const [res] = await pool.query(
        `UPDATE certificado SET estado = ? WHERE id_certificado = ? AND activo = 1`,
        [estado, id]
    );
    if (res.affectedRows === 0) throw new Error('Certificado no encontrado');
}

// ============================================================
// ELIMINAR (lógico)
// ============================================================

async function eliminarCertificado(id) {
    const [res] = await pool.query(
        `UPDATE certificado SET activo = 0 WHERE id_certificado = ?`,
        [id]
    );
    if (res.affectedRows === 0) throw new Error('Certificado no encontrado');
}

module.exports = {
    crearCertificado,
    obtenerPorId,
    buscarCertificados,
    listarCertificados,
    actualizarEstado,
    eliminarCertificado
};
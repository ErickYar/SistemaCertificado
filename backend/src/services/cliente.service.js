const { pool } = require('../config/database');
const auditoria = require('./auditoria.service');

async function buscarPorDocumento(documento) {
    const [rows] = await pool.query(
        `SELECT * FROM cliente
         WHERE activo = 1 AND (dni = ? OR ruc = ?)
         LIMIT 1`,
        [documento, documento]
    );
    return rows.length > 0 ? rows[0] : null;
}

async function buscarPorNombre(texto) {
    const like = `%${texto}%`;
    const [rows] = await pool.query(
        `SELECT * FROM cliente
         WHERE activo = 1
           AND (nombres LIKE ? OR apellidos LIKE ? OR razon_social LIKE ?)
         ORDER BY razon_social, apellidos, nombres
         LIMIT 20`,
        [like, like, like]
    );
    return rows;
}

async function obtenerPorId(id) {
    const [rows] = await pool.query(
        `SELECT * FROM cliente WHERE id_cliente = ? LIMIT 1`,
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
}

async function crearCliente(data, usuario) {
    if (data.tipo_persona === 'NATURAL') {
        if (!data.dni) throw new Error('El DNI es obligatorio para persona natural');
        if (!data.nombres || !data.apellidos) {
            throw new Error('Nombres y apellidos son obligatorios');
        }
    } else if (data.tipo_persona === 'JURIDICA') {
        if (!data.ruc) throw new Error('El RUC es obligatorio para persona jurídica');
        if (!data.razon_social) throw new Error('La razón social es obligatoria');
    } else {
        throw new Error('tipo_persona debe ser NATURAL o JURIDICA');
    }

    const doc = data.tipo_persona === 'NATURAL' ? data.dni : data.ruc;
    const existente = await buscarPorDocumento(doc);
    if (existente) {
        throw new Error(`Ya existe un cliente con ese documento (id ${existente.id_cliente})`);
    }

    const [res] = await pool.query(
        `INSERT INTO cliente
         (tipo_persona, nombres, apellidos, dni, razon_social, ruc,
          direccion, distrito, provincia, departamento, telefono, correo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.tipo_persona,
            data.nombres       || null,
            data.apellidos     || null,
            data.dni           || null,
            data.razon_social  || null,
            data.ruc           || null,
            data.direccion     || null,
            data.distrito      || null,
            data.provincia     || null,
            data.departamento  || null,
            data.telefono      || null,
            data.correo        || null
        ]
    );

    const idCliente = res.insertId;

    // 📝 AUDITORÍA
    await auditoria.registrar({
        tabla: 'cliente',
        id_registro: idCliente,
        accion: 'CREAR',
        usuario,
        datosNuevos: data,
        descripcion: `Cliente creado: ${data.razon_social || `${data.nombres} ${data.apellidos}`}`
    });

    return idCliente;
}

async function actualizarCliente(id, data, usuario) {
    const actual = await obtenerPorId(id);
    if (!actual) throw new Error('Cliente no encontrado');

    const campos  = [];
    const valores = [];

    const asignar = (col, val) => {
        if (val !== undefined) {
            campos.push(`${col} = ?`);
            valores.push(val);
        }
    };

    asignar('nombres',      data.nombres);
    asignar('apellidos',    data.apellidos);
    asignar('dni',          data.dni);
    asignar('razon_social', data.razon_social);
    asignar('ruc',          data.ruc);
    asignar('direccion',    data.direccion);
    asignar('distrito',     data.distrito);
    asignar('provincia',    data.provincia);
    asignar('departamento', data.departamento);
    asignar('telefono',     data.telefono);
    asignar('correo',       data.correo);

    if (campos.length === 0) return;

    valores.push(id);
    await pool.query(
        `UPDATE cliente SET ${campos.join(', ')} WHERE id_cliente = ?`,
        valores
    );

    // 📝 AUDITORÍA
    await auditoria.registrar({
        tabla: 'cliente',
        id_registro: id,
        accion: 'ACTUALIZAR',
        usuario,
        datosAnteriores: actual,
        datosNuevos: { ...actual, ...data },
        descripcion: `Cliente actualizado: ${data.razon_social || actual.razon_social || `${actual.nombres} ${actual.apellidos}`}`
    });
}

async function eliminarCliente(id, usuario) {
    const actual = await obtenerPorId(id);
    if (!actual) throw new Error('Cliente no encontrado');

    const [res] = await pool.query(
        `UPDATE cliente SET activo = 0 WHERE id_cliente = ?`,
        [id]
    );
    if (res.affectedRows === 0) throw new Error('Cliente no encontrado');

    // 📝 AUDITORÍA
    await auditoria.registrar({
        tabla: 'cliente',
        id_registro: id,
        accion: 'ELIMINAR',
        usuario,
        datosAnteriores: actual,
        descripcion: `Cliente eliminado: ${actual.razon_social || `${actual.nombres} ${actual.apellidos}`}`
    });
}

async function listarClientes() {
    const [rows] = await pool.query(
        `SELECT * FROM cliente
         WHERE activo = 1
         ORDER BY fecha_registro DESC`
    );
    return rows;
}

module.exports = {
    buscarPorDocumento,
    buscarPorNombre,
    obtenerPorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    listarClientes
};
const { pool } = require('../config/database');

// ------------------------------------------------------------
// Listar vehículos con datos del cliente y catálogos (JOIN)
// ------------------------------------------------------------
async function listarVehiculos() {
    const [rows] = await pool.query(
        `SELECT v.id_vehiculo, v.placa, v.numero_vin, v.numero_serie,
                v.anio_fabricacion, v.anio_modelo, v.version,
                v.activo, v.fecha_registro,
                ca.descripcion AS categoria,
                ma.nombre      AS marca,
                mo.nombre      AS modelo,
                co1.nombre     AS color_1,
                co2.nombre     AS color_2,
                co3.nombre     AS color_3,
                cc.nombre      AS carroceria,
                tu.nombre      AS tipo_uso,
                fr.nombre      AS forma_rodamiento,
                cdo.nombre     AS condicion,
                zr.nombre      AS zona_registral,
                sr.nombre      AS sede_registral,
                v.id_motor, v.id_cliente,
                cl.tipo_persona, cl.razon_social, cl.nombres, cl.apellidos,
                cl.dni, cl.ruc
         FROM vehiculo v
         LEFT JOIN cat_categoria       ca  ON ca.codigo    = v.id_categoria
         LEFT JOIN cat_marca           ma  ON ma.id_marca  = v.id_marca
         LEFT JOIN cat_modelo          mo  ON mo.id_modelo = v.id_modelo
         LEFT JOIN cat_color           co1 ON co1.codigo   = v.cod_color_1
         LEFT JOIN cat_color           co2 ON co2.codigo   = v.cod_color_2
         LEFT JOIN cat_color           co3 ON co3.codigo   = v.cod_color_3
         LEFT JOIN cat_carroceria      cc  ON cc.id_carroceria = v.id_carroceria
         LEFT JOIN cat_tipo_uso        tu  ON tu.id_uso    = v.id_tipo_uso
         LEFT JOIN cat_forma_rodamiento fr ON fr.id_forma = v.id_forma_rodamiento
         LEFT JOIN cat_condicion       cdo ON cdo.codigo   = v.cod_condicion
         LEFT JOIN cat_zona_registral  zr  ON zr.codigo    = v.cod_zona_registral
         LEFT JOIN cat_sede_registral  sr  ON sr.id_sede   = v.id_sede_registral
         LEFT JOIN cliente             cl  ON cl.id_cliente = v.id_cliente
         WHERE v.activo = 1
         ORDER BY v.fecha_registro DESC`
    );
    return rows;
}

// ------------------------------------------------------------
// Obtener vehículo por ID (con datos del motor)
// ------------------------------------------------------------
async function obtenerPorId(id) {
    const [rows] = await pool.query(
        `SELECT v.*,
                m.numero_motor, m.cod_combustible, m.cilindros,
                m.cilindrada, m.potencia_cv, m.potencia_rpm,
                m.observaciones AS motor_observaciones
         FROM vehiculo v
         LEFT JOIN motor m ON m.id_motor = v.id_motor
         WHERE v.id_vehiculo = ? AND v.activo = 1
         LIMIT 1`,
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
}

// ------------------------------------------------------------
// Buscar por placa (puede haber varias por renovación)
// ------------------------------------------------------------
async function buscarPorPlaca(placa) {
    const [rows] = await pool.query(
        `SELECT v.*,
                ma.nombre AS marca, mo.nombre AS modelo,
                cl.razon_social, cl.nombres, cl.apellidos
         FROM vehiculo v
         LEFT JOIN cat_marca  ma ON ma.id_marca  = v.id_marca
         LEFT JOIN cat_modelo mo ON mo.id_modelo = v.id_modelo
         LEFT JOIN cliente    cl ON cl.id_cliente = v.id_cliente
         WHERE v.placa = ? AND v.activo = 1
         ORDER BY v.fecha_registro DESC`,
        [placa]
    );
    return rows;
}

// ------------------------------------------------------------
// Buscar por VIN
// ------------------------------------------------------------
async function buscarPorVin(vin) {
    const [rows] = await pool.query(
        `SELECT v.*,
                ma.nombre AS marca, mo.nombre AS modelo,
                cl.razon_social, cl.nombres, cl.apellidos
         FROM vehiculo v
         LEFT JOIN cat_marca  ma ON ma.id_marca  = v.id_marca
         LEFT JOIN cat_modelo mo ON mo.id_modelo = v.id_modelo
         LEFT JOIN cliente    cl ON cl.id_cliente = v.id_cliente
         WHERE v.numero_vin = ? AND v.activo = 1
         ORDER BY v.fecha_registro DESC`,
        [vin]
    );
    return rows;
}

// ------------------------------------------------------------
// Crear vehículo (con o sin motor)
// ------------------------------------------------------------
async function crearVehiculo(data) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Validaciones mínimas
        if (!data.placa)          throw new Error('La placa es obligatoria');
        if (!data.numero_vin)     throw new Error('El número de VIN es obligatorio');
        if (!data.id_cliente)     throw new Error('El cliente es obligatorio');

        // 2. Verificar que el cliente exista
        const [cli] = await conn.query(
            `SELECT id_cliente FROM cliente WHERE id_cliente = ? AND activo = 1`,
            [data.id_cliente]
        );
        if (cli.length === 0) throw new Error('El cliente no existe o está inactivo');

        // 3. Crear motor si viene con datos
        let idMotor = null;
        if (data.motor && data.motor.numero_motor) {
            const m = data.motor;
            const [resMotor] = await conn.query(
                `INSERT INTO motor
                 (numero_motor, cod_combustible, cilindros, cilindrada,
                  potencia_cv, potencia_rpm, observaciones)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    m.numero_motor,
                    m.cod_combustible || 'SIN VALOR',
                    m.cilindros       || null,
                    m.cilindrada      || null,
                    m.potencia_cv     || null,
                    m.potencia_rpm    || null,
                    m.observaciones   || null
                ]
            );
            idMotor = resMotor.insertId;
        }

        // 4. Insertar vehículo
        const [res] = await conn.query(
            `INSERT INTO vehiculo (
                placa, partida_registral, numero_vin, numero_serie,
                dua_dam, titulo, fecha_titulo,
                id_categoria, id_marca, id_modelo, version,
                anio_fabricacion, anio_modelo,
                cod_color_1, cod_color_2, cod_color_3,
                id_carroceria, id_tipo_uso, id_forma_rodamiento, cod_condicion,
                longitud_m, ancho_m, altura_m,
                peso_bruto_tn, peso_neto_tn, carga_util_tn,
                asientos, pasajeros, ruedas, ejes,
                cod_zona_registral, id_sede_registral, fecha_inmatriculacion,
                id_motor, id_cliente
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                       ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.placa,
                data.partida_registral     || null,
                data.numero_vin,
                data.numero_serie          || null,
                data.dua_dam               || null,
                data.titulo                || null,
                data.fecha_titulo          || null,
                data.id_categoria          || null,
                data.id_marca              || null,
                data.id_modelo             || null,
                data.version               || null,
                data.anio_fabricacion      || null,
                data.anio_modelo           || null,
                data.cod_color_1           || null,
                data.cod_color_2           || null,
                data.cod_color_3           || null,
                data.id_carroceria         || null,
                data.id_tipo_uso           || null,
                data.id_forma_rodamiento   || null,
                data.cod_condicion         || 'NUEVO',
                data.longitud_m            || null,
                data.ancho_m               || null,
                data.altura_m              || null,
                data.peso_bruto_tn         || null,
                data.peso_neto_tn          || null,
                data.carga_util_tn         || null,
                data.asientos              || null,
                data.pasajeros             || null,
                data.ruedas                || null,
                data.ejes                  || null,
                data.cod_zona_registral    || null,
                data.id_sede_registral     || null,
                data.fecha_inmatriculacion || null,
                idMotor,
                data.id_cliente
            ]
        );

        await conn.commit();
        return res.insertId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ------------------------------------------------------------
// Actualizar vehículo
// ------------------------------------------------------------
async function actualizarVehiculo(id, data) {
    const actual = await obtenerPorId(id);
    if (!actual) throw new Error('Vehículo no encontrado');

    const campos  = [];
    const valores = [];

    const asignar = (col, val) => {
        if (val !== undefined) {
            campos.push(`${col} = ?`);
            valores.push(val);
        }
    };

    // Campos del vehículo
    asignar('placa',                data.placa);
    asignar('partida_registral',    data.partida_registral);
    asignar('numero_vin',           data.numero_vin);
    asignar('numero_serie',         data.numero_serie);
    asignar('dua_dam',              data.dua_dam);
    asignar('titulo',               data.titulo);
    asignar('fecha_titulo',         data.fecha_titulo);
    asignar('id_categoria',         data.id_categoria);
    asignar('id_marca',             data.id_marca);
    asignar('id_modelo',            data.id_modelo);
    asignar('version',              data.version);
    asignar('anio_fabricacion',     data.anio_fabricacion);
    asignar('anio_modelo',          data.anio_modelo);
    asignar('cod_color_1',          data.cod_color_1);
    asignar('cod_color_2',          data.cod_color_2);
    asignar('cod_color_3',          data.cod_color_3);
    asignar('id_carroceria',        data.id_carroceria);
    asignar('id_tipo_uso',          data.id_tipo_uso);
    asignar('id_forma_rodamiento',  data.id_forma_rodamiento);
    asignar('cod_condicion',        data.cod_condicion);
    asignar('longitud_m',           data.longitud_m);
    asignar('ancho_m',              data.ancho_m);
    asignar('altura_m',             data.altura_m);
    asignar('peso_bruto_tn',        data.peso_bruto_tn);
    asignar('peso_neto_tn',         data.peso_neto_tn);
    asignar('carga_util_tn',        data.carga_util_tn);
    asignar('asientos',             data.asientos);
    asignar('pasajeros',            data.pasajeros);
    asignar('ruedas',               data.ruedas);
    asignar('ejes',                 data.ejes);
    asignar('cod_zona_registral',   data.cod_zona_registral);
    asignar('id_sede_registral',    data.id_sede_registral);
    asignar('fecha_inmatriculacion',data.fecha_inmatriculacion);

    if (campos.length > 0) {
        valores.push(id);
        await pool.query(
            `UPDATE vehiculo SET ${campos.join(', ')} WHERE id_vehiculo = ?`,
            valores
        );
    }

    // Actualizar motor si viene
    if (data.motor && actual.id_motor) {
        const m = data.motor;
        const camposM = [];
        const valoresM = [];

        const asignarM = (col, val) => {
            if (val !== undefined) {
                camposM.push(`${col} = ?`);
                valoresM.push(val);
            }
        };

        asignarM('numero_motor',     m.numero_motor);
        asignarM('cod_combustible',  m.cod_combustible);
        asignarM('cilindros',        m.cilindros);
        asignarM('cilindrada',       m.cilindrada);
        asignarM('potencia_cv',      m.potencia_cv);
        asignarM('potencia_rpm',     m.potencia_rpm);
        asignarM('observaciones',    m.observaciones);

        if (camposM.length > 0) {
            valoresM.push(actual.id_motor);
            await pool.query(
                `UPDATE motor SET ${camposM.join(', ')} WHERE id_motor = ?`,
                valoresM
            );
        }
    }
}

// ------------------------------------------------------------
// Eliminar (lógico)
// ------------------------------------------------------------
async function eliminarVehiculo(id) {
    const [res] = await pool.query(
        `UPDATE vehiculo SET activo = 0 WHERE id_vehiculo = ?`,
        [id]
    );
    if (res.affectedRows === 0) throw new Error('Vehículo no encontrado');
}

module.exports = {
    listarVehiculos,
    obtenerPorId,
    buscarPorPlaca,
    buscarPorVin,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo
};
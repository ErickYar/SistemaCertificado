const { pool } = require('../config/database');

async function listarCategorias() {
    const [rows] = await pool.query(
        `SELECT codigo, descripcion, grupo, destino
         FROM cat_categoria
         ORDER BY grupo, codigo`
    );
    return rows;
}

async function listarMarcas() {
    const [rows] = await pool.query(
        `SELECT id_marca, nombre
         FROM cat_marca
         WHERE activo = 1
         ORDER BY nombre`
    );
    return rows;
}

async function listarModelosPorMarca(idMarca) {
    const [rows] = await pool.query(
        `SELECT id_modelo, nombre
         FROM cat_modelo
         WHERE id_marca = ? AND activo = 1
         ORDER BY nombre`,
        [idMarca]
    );
    return rows;
}

async function listarColores() {
    const [rows] = await pool.query(
        `SELECT codigo, nombre
         FROM cat_color
         WHERE activo = 1
         ORDER BY nombre`
    );
    return rows;
}

async function listarCarrocerias(idCategoria) {
    if (idCategoria) {
        const [rows] = await pool.query(
            `SELECT codigo, nombre
             FROM cat_carroceria
             WHERE id_categoria = ? AND activo = 1
             ORDER BY nombre`,
            [idCategoria]
        );
        return rows;
    }
    const [rows] = await pool.query(
        `SELECT codigo, nombre, id_categoria
         FROM cat_carroceria
         WHERE activo = 1
         ORDER BY nombre`
    );
    return rows;
}

async function listarTiposUso() {
    const [rows] = await pool.query(
        `SELECT id_uso, nombre
         FROM cat_tipo_uso
         WHERE activo = 1
         ORDER BY nombre`
    );
    return rows;
}

async function listarFormasRodamiento() {
    const [rows] = await pool.query(
        `SELECT id_forma, nombre
         FROM cat_forma_rodamiento
         ORDER BY nombre`
    );
    return rows;
}

async function listarCondiciones() {
    const [rows] = await pool.query(
        `SELECT codigo, nombre
         FROM cat_condicion
         ORDER BY codigo`
    );
    return rows;
}

async function listarCombustibles() {
    const [rows] = await pool.query(
        `SELECT codigo, nombre
         FROM cat_combustible
         ORDER BY codigo`
    );
    return rows;
}

async function listarZonasRegistrales() {
    const [rows] = await pool.query(
        `SELECT codigo, nombre
         FROM cat_zona_registral
         ORDER BY codigo`
    );
    return rows;
}

async function listarSedesPorZona(codZona) {
    const [rows] = await pool.query(
        `SELECT id_sede, nombre
         FROM cat_sede_registral
         WHERE cod_zona = ? AND activo = 1
         ORDER BY nombre`,
        [codZona]
    );
    return rows;
}

async function listarTiposSuspension() {
    const [rows] = await pool.query(
        `SELECT codigo, nombre
         FROM cat_tipo_suspension`
    );
    return rows;
}

async function listarClasesNeumatico() {
    const [rows] = await pool.query(
        `SELECT codigo, nombre
         FROM cat_clase_neumatico`
    );
    return rows;
}

async function listarDepartamentos() {
    const [rows] = await pool.query(
        `SELECT id_departamento, nombre
         FROM departamentos
         ORDER BY nombre`
    );
    return rows;
}

async function listarProvinciasPorDepartamento(idDepartamento) {
    const [rows] = await pool.query(
        `SELECT id_provincia, nombre
         FROM provincias
         WHERE id_departamento = ?
         ORDER BY nombre`,
        [idDepartamento]
    );
    return rows;
}

async function listarDistritosPorProvincia(idProvincia) {
    const [rows] = await pool.query(
        `SELECT id_distrito, nombre
         FROM distritos
         WHERE id_provincia = ?
         ORDER BY nombre`,
        [idProvincia]
    );
    return rows;
}

module.exports = {
    listarCategorias,
    listarMarcas,
    listarModelosPorMarca,
    listarColores,
    listarCarrocerias,
    listarTiposUso,
    listarFormasRodamiento,
    listarCondiciones,
    listarCombustibles,
    listarZonasRegistrales,
    listarSedesPorZona,
    listarTiposSuspension,
    listarClasesNeumatico,
    listarDepartamentos,
    listarProvinciasPorDepartamento,
    listarDistritosPorProvincia
};
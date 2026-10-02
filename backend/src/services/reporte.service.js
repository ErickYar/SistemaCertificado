const { pool } = require('../config/database');

// ============================================================
// TOTALES DEL DÍA
// ============================================================
async function totalesDelDia(fecha = null) {
    const fechaRef = fecha || new Date().toISOString().slice(0, 10);

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS total
         FROM pago
         WHERE activo = 1 AND pagado = 1
           AND DATE(fecha_pago) = ?`,
        [fechaRef]
    );

    return {
        fecha: fechaRef,
        cantidad: Number(rows[0].cantidad),
        total: Number(rows[0].total)
    };
}

// ============================================================
// TOTALES DE LA SEMANA (lunes a domingo)
// ============================================================
async function totalesDeLaSemana(fecha = null) {
    const fechaRef = fecha ? new Date(fecha) : new Date();

    // Calcular lunes y domingo
    const dia   = fechaRef.getDay();               // 0=domingo, 1=lunes...
    const diffLunes = (dia === 0 ? -6 : 1 - dia);  // días hasta el lunes
    const lunes = new Date(fechaRef);
    lunes.setDate(fechaRef.getDate() + diffLunes);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const lunesStr   = lunes.toISOString().slice(0, 10);
    const domingoStr = domingo.toISOString().slice(0, 10);

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS total
         FROM pago
         WHERE activo = 1 AND pagado = 1
           AND DATE(fecha_pago) BETWEEN ? AND ?`,
        [lunesStr, domingoStr]
    );

    return {
        desde: lunesStr,
        hasta: domingoStr,
        cantidad: Number(rows[0].cantidad),
        total: Number(rows[0].total)
    };
}

// ============================================================
// TOTALES DEL MES
// ============================================================
async function totalesDelMes(anioMes = null) {
    const ref = anioMes || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS total
         FROM pago
         WHERE activo = 1 AND pagado = 1
           AND DATE_FORMAT(fecha_pago, '%Y-%m') = ?`,
        [ref]
    );

    return {
        mes: ref,
        cantidad: Number(rows[0].cantidad),
        total: Number(rows[0].total)
    };
}
// ============================================================
// CERTIFICADOS DEL DÍA
// ============================================================
async function certificadosDelDia(fecha = null) {
    const fechaRef = fecha || new Date().toISOString().slice(0, 10);

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad
         FROM certificado
         WHERE activo = 1
           AND DATE(fecha_registro) = ?`,
        [fechaRef]
    );

    return Number(rows[0].cantidad);
}

// ============================================================
// CERTIFICADOS DE LA SEMANA
// ============================================================
async function certificadosDeLaSemana(fecha = null) {
    const fechaRef = fecha ? new Date(fecha) : new Date();

    const dia = fechaRef.getDay();
    const diffLunes = (dia === 0 ? -6 : 1 - dia);
    const lunes = new Date(fechaRef);
    lunes.setDate(fechaRef.getDate() + diffLunes);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const lunesStr   = lunes.toISOString().slice(0, 10);
    const domingoStr = domingo.toISOString().slice(0, 10);

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad
         FROM certificado
         WHERE activo = 1
           AND DATE(fecha_registro) BETWEEN ? AND ?`,
        [lunesStr, domingoStr]
    );

    return Number(rows[0].cantidad);
}
// ============================================================
// REPORTE COMPLETO (día + semana)
// ============================================================
async function reporteCompleto() {
    const dia    = await totalesDelDia();
    const semana = await totalesDeLaSemana();

    return {
        fecha: dia.fecha,
        dia: {
            cantidad: dia.cantidad,
            total: dia.total
        },
        semana: {
            desde: semana.desde,
            hasta: semana.hasta,
            cantidad: semana.cantidad,
            total: semana.total
        }
    };
}

// ============================================================
// GENERAR MENSAJE DE TEXTO
// ============================================================
async function generarMensaje() {
    // Pagos
    const dia       = await totalesDelDia();
    const semana    = await totalesDeLaSemana();
    const quince    = await totalesQuinceDias();
    const mes       = await totalesDelMes();

    // Certificados
    const certDia    = await certificadosDelDia();
    const certSemana = await certificadosDeLaSemana();
    const certQuince = await certificadosQuinceDias();
    const certMes    = await certificadosDelMes();

    const reporte = {
        fecha: dia.fecha,
        dia:    { cantidad: dia.cantidad,    total: dia.total,    certificados: certDia },
        semana: { desde: semana.desde, hasta: semana.hasta, cantidad: semana.cantidad, total: semana.total, certificados: certSemana },
        quince: { desde: quince.desde, hasta: quince.hasta, cantidad: quince.cantidad, total: quince.total, certificados: certQuince },
        mes:    { mes: mes.mes, cantidad: mes.cantidad, total: mes.total, certificados: certMes }
    };

    const mensaje = 
        `📊 *Reporte del día* ${reporte.fecha}\n\n` +
        `*── DEL DÍA ──*\n` +
        `📝 Certificados: *${certDia}*\n` +
        `💰 Recaudado: *S/ ${reporte.dia.total.toFixed(2)}*\n\n` +
        `*── SEMANA ──*\n` +
        `📝 Certificados: *${certSemana}*\n` +
        `💰 Recaudado: *S/ ${reporte.semana.total.toFixed(2)}*\n\n` +
        `*── ÚLTIMOS 15 DÍAS ──*\n` +
        `📝 Certificados: *${certQuince}*\n` +
        `💰 Recaudado: *S/ ${reporte.quince.total.toFixed(2)}*\n\n` +
        `*── MES ──*\n` +
        `📝 Certificados: *${certMes}*\n` +
        `💰 Recaudado: *S/ ${reporte.mes.total.toFixed(2)}*`;

    return { mensaje, reporte };
}

// ============================================================
// LISTAR TELÉFONOS PARA REPORTE
// ============================================================
async function listarTelefonos(tipo) {
    // tipo: 'DIARIO' o 'VIERNES'
    const campo = tipo === 'VIERNES' ? 'recibe_viernes' : 'recibe_diario';

    const [rows] = await pool.query(
        `SELECT id_config, nombre, telefono
         FROM configuracion_reporte
         WHERE activo = 1 AND ${campo} = 1`
    );
    return rows;
}

// ============================================================
// REGISTRAR ENVÍO EN EL LOG
// ============================================================
async function registrarEnvio(tipo, reporte, mensaje, enviado) {
    await pool.query(
        `INSERT INTO reporte_log
         (tipo, fecha_corte, monto_dia, monto_semana, monto_quince, monto_mes,
          cert_dia, cert_semana, cert_quince, cert_mes,
          mensaje_txt, enviado, fecha_envio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tipo,
            reporte.fecha,
            reporte.dia.total,
            reporte.semana.total,
            reporte.quince.total,
            reporte.mes.total,
            reporte.dia.certificados,
            reporte.semana.certificados,
            reporte.quince.certificados,
            reporte.mes.certificados,
            mensaje,
            enviado ? 1 : 0,
            enviado ? new Date() : null
        ]
    );
}

// ============================================================
// LISTAR HISTORIAL DE ENVÍOS
// ============================================================
async function listarHistorial(limite = 50) {
    const [rows] = await pool.query(
        `SELECT * FROM reporte_log
         ORDER BY id_reporte DESC
         LIMIT ?`,
        [limite]
    );
    return rows;
}


async function listarDestinatarios(tipo, canal = 'TELEGRAM') {
    const campo = tipo === 'VIERNES' ? 'recibe_viernes' : 'recibe_diario';

    const [rows] = await pool.query(
        `SELECT id_config, nombre, telefono, chat_id, canal
         FROM configuracion_reporte
         WHERE activo = 1 AND ${campo} = 1 AND canal = ?`,
        [canal]
    );
    return rows;
}













// ============================================================
// CERTIFICADOS DE LOS ÚLTIMOS 15 DÍAS
// ============================================================
async function certificadosQuinceDias(fecha = null) {
    const fechaRef = fecha ? new Date(fecha) : new Date();
    const hace15 = new Date(fechaRef);
    hace15.setDate(fechaRef.getDate() - 14);   // 15 días incluyendo hoy

    const desdeStr = hace15.toISOString().slice(0, 10);
    const hastaStr = fechaRef.toISOString().slice(0, 10);

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad
         FROM certificado
         WHERE activo = 1
           AND DATE(fecha_registro) BETWEEN ? AND ?`,
        [desdeStr, hastaStr]
    );

    return Number(rows[0].cantidad);
}

// ============================================================
// CERTIFICADOS DEL MES
// ============================================================
async function certificadosDelMes(anioMes = null) {
    const ref = anioMes || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad
         FROM certificado
         WHERE activo = 1
           AND DATE_FORMAT(fecha_registro, '%Y-%m') = ?`,
        [ref]
    );

    return Number(rows[0].cantidad);
}

// ============================================================
// PAGOS DE LOS ÚLTIMOS 15 DÍAS
// ============================================================
async function totalesQuinceDias(fecha = null) {
    const fechaRef = fecha ? new Date(fecha) : new Date();
    const hace15 = new Date(fechaRef);
    hace15.setDate(fechaRef.getDate() - 14);

    const desdeStr = hace15.toISOString().slice(0, 10);
    const hastaStr = fechaRef.toISOString().slice(0, 10);

    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS total
         FROM pago
         WHERE activo = 1 AND pagado = 1
           AND DATE(fecha_pago) BETWEEN ? AND ?`,
        [desdeStr, hastaStr]
    );

    return {
        desde: desdeStr,
        hasta: hastaStr,
        cantidad: Number(rows[0].cantidad),
        total: Number(rows[0].total)
    };
}


module.exports = {
    totalesDelDia,
    totalesDeLaSemana,
    totalesQuinceDias,
    totalesDelMes,
    certificadosDelDia,        // ← NUEVA
    certificadosDeLaSemana,    // ← NUEVA
    certificadosQuinceDias,
    certificadosDelMes,
    reporteCompleto,
    generarMensaje,
    listarTelefonos,
    listarDestinatarios,
    registrarEnvio,
    listarHistorial
};
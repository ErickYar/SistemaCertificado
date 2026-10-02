const cron = require('node-cron');
const reporteSvc = require('../services/reporte.service');
const telegramSvc = require('../services/telegram.service');

async function ejecutarEnvio(tipo) {
    try {
        console.log(`📤 Generando reporte ${tipo}...`);

        const { mensaje, reporte } = await reporteSvc.generarMensaje();

        // Obtener destinatarios TELEGRAM
        const destinatarios = await reporteSvc.listarDestinatarios(tipo, 'TELEGRAM');

        if (destinatarios.length === 0) {
            console.warn('⚠️ No hay destinatarios de Telegram configurados.');
        }

        const chatIds = destinatarios.map(d => d.chat_id).filter(Boolean);

        let enviado = false;
        if (chatIds.length > 0) {
            const resultados = await telegramSvc.enviarMensajeMultiple(chatIds, mensaje);
            enviado = resultados.some(r => r.ok);
        }

        // Registrar en el log
        await reporteSvc.registrarEnvio(tipo, reporte, mensaje, enviado);

        console.log(`✅ Reporte ${tipo} procesado (enviado: ${enviado})`);
    } catch (err) {
        console.error(`❌ Error en reporte ${tipo}:`, err.message);
    }
}

function iniciarScheduler() {
    // Todos los días a las 19:00 (7 PM)
    cron.schedule('0 19 * * *', () => ejecutarEnvio('DIARIO'), {
        timezone: 'America/Lima'
    });

    // Todos los viernes a las 19:00 (7 PM)
    cron.schedule('0 19 * * 5', () => ejecutarEnvio('VIERNES'), {
        timezone: 'America/Lima'
    });

    console.log('⏰ Scheduler de reportes iniciado (7 PM diario + 7 PM viernes)');
}

module.exports = { iniciarScheduler, ejecutarEnvio };
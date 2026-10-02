const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

// ============================================================
// Enviar mensaje de texto a un Chat ID
// ============================================================
async function enviarMensaje(chatId, mensaje) {
    try {
        const response = await axios.post(`${BASE_URL}/sendMessage`, {
            chat_id: chatId,
            text: mensaje,
            parse_mode: 'Markdown'  // permite *negrita*, _cursiva_, etc.
        });

        console.log(`✅ Mensaje enviado a Telegram (chat ${chatId})`);
        return { ok: true, data: response.data };

    } catch (error) {
        console.error(
            `❌ Error al enviar a Telegram (chat ${chatId}):`,
            error.response?.data || error.message
        );
        return { ok: false, error: error.response?.data || error.message };
    }
}

// ============================================================
// Enviar a varios Chat IDs
// ============================================================
async function enviarMensajeMultiple(chatIds, mensaje) {
    const resultados = [];
    for (const chatId of chatIds) {
        const r = await enviarMensaje(chatId, mensaje);
        resultados.push({ chatId, ...r });
    }
    return resultados;
}

module.exports = { enviarMensaje, enviarMensajeMultiple };
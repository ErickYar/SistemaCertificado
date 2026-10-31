const app = require('./app');
const { probarConexion } = require('./config/database');
const { iniciarScheduler } = require('./utils/scheduler');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 4000;

(async () => {
    await probarConexion();

   app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
        iniciarScheduler();
    });
})();
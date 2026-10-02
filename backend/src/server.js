const app = require('./app');
const { probarConexion } = require('./config/database');
const { iniciarScheduler } = require('./utils/scheduler');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 4000;

(async () => {
    await probarConexion();

    app.listen(PORT, () => {
        console.log(`🚀 Servidor en http://localhost:${PORT}`);
        iniciarScheduler();
    });
})();
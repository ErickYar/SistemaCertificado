const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rutas = require('./routes');
const { manejadorErrores } = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Ruta raíz para verificar
app.get('/', (_req, res) => {
    res.json({
        ok: true,
        mensaje: 'API sistemCerti funcionando 🚀',
        timestamp: new Date().toISOString()
    });
});

// Aquí se montan todas las rutas bajo /api
app.use('/api', rutas);

// Manejo central de errores (siempre al final)
app.use(manejadorErrores);

module.exports = app;
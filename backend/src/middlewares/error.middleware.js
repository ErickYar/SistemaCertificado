function manejadorErrores(err, _req, res, _next) {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        mensaje: err.message || 'Error interno del servidor'
    });
}

module.exports = { manejadorErrores };
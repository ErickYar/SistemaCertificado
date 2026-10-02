const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');

async function crearAdmin() {
    const usuario  = 'admin';
    const password = 'Erick123@';

    try {
        const hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `UPDATE usuario SET password_hash = ? WHERE nombre_usuario = ?`,
            [hash, usuario]
        );

        if (result.affectedRows === 0) {
            console.log('⚠️  No existe el usuario', usuario, 'en la BD.');
        } else {
            console.log('✅ Hash actualizado para:', usuario);
            console.log('   Contraseña nueva:', password);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

crearAdmin();
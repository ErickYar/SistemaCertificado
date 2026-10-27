const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               Number(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'sistemCerti',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4',
    ssl:                { rejectUnauthorized: false } 
});

async function probarConexion() {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        console.log('✅ Conectado a MySQL —', process.env.DB_NAME);
    } catch (err) {
        console.error('❌ Error de conexión a MySQL:', err.message);
        process.exit(1);
    }
}

module.exports = { pool, probarConexion };
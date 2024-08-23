const mysql = require('mysql2');
require('dotenv').config();

let db;

function connectDatabase() {
    db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    db.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            setTimeout(connectDatabase, 2000); // Intentar reconectar después de 2 segundos
        } else {
            console.log('Connected to the database.');
        }
    });

    db.on('error', err => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Attempting to reconnect...');
            connectDatabase(); // Reconectar si la conexión se pierde
        } else {
            throw err; // Manejar otros errores
        }
    });
}

// Iniciar la conexión
connectDatabase();

// Keep-alive query
setInterval(() => {
    if (db && db.state === 'authenticated') {
        db.query('SELECT 1', (err) => {
            if (err) console.error('Error keeping the connection alive:', err);
        });
    }
}, 300000); // Ejecutar cada 5 minutos

module.exports = db;

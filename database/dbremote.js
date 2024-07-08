const mysql = require('mysql2');
const fs = require('fs');
const { createTunnel } = require('tunnel-ssh');
require('dotenv').config();

const port = process.env.DB2_LOCAL_PORT || 5000;

const sshOptions = {
    host: process.env.SSH_HOST,
    port: parseInt(process.env.SSH_PORT, 10),
    username: process.env.SSH_USER,
    privateKey: fs.readFileSync(process.env.SSH_KEY_PATH)
};

let tunnel; // Variable para almacenar la instancia del túnel SSH

function mySimpleTunnel(sshOptions, port, autoClose = true) {
    const forwardOptions = {
        srcAddr: '127.0.0.1',
        srcPort: port,
        dstAddr: '127.0.0.1',
        dstPort: process.env.DB2_PORT || 3306
    };

    const tunnelOptions = {
        autoClose: autoClose
    };

    const serverOptions = {
        port: port
    };

    return createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);
}

const connectToDb = async () => {
    try {
        // Verificar si ya hay un túnel activo
        if (!tunnel) {
            // Si no hay túnel activo, crear uno nuevo
            [tunnel] = await mySimpleTunnel(sshOptions, port);
            console.log('SSH tunnel established successfully.');
        } else {
            console.log('Reusing existing SSH tunnel.');
        }

        // Configurar la conexión a la base de datos remota
        const dbRemote = mysql.createConnection({
            host: '127.0.0.1',
            port: port,
            user: process.env.DB2_USER,
            password: process.env.DB2_PASSWORD,
            database: process.env.DB2_NAME
        });

        // Manejar eventos de error y desconexión
        dbRemote.on('error', (err) => {
            console.error('Database error:', err);
            // Intentar reconectar o manejar según tu lógica de aplicación
        });

        dbRemote.on('end', () => {
            console.log('Database connection closed.');
        });

        // Conectar a la base de datos remota
        dbRemote.connect((err) => {
            if (err) {
                console.error('Error connecting to the remote database:', err);
                throw err;
            }
            console.log('Connected to the remote database.');
        });

        return dbRemote;

    } catch (error) {
        console.error('Error establishing SSH connection:', error);
        throw error;
    }
};

module.exports = connectToDb;

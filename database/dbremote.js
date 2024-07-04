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
        const [server, conn] = await mySimpleTunnel(sshOptions, port);

        console.log('SSH tunnel established successfully.');

        const dbRemote = mysql.createConnection({
            host: '127.0.0.1',
            port: port,
            user: process.env.DB2_USER,
            password: process.env.DB2_PASSWORD,
            database: process.env.DB2_NAME
        });

        dbRemote.connect(err => {
            if (err) {
                console.error('Error connecting to the remote database:', err);
                return;
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

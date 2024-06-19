const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const tunnel = require('tunnel-ssh');
require('dotenv').config();

const sshConfig = {
    username: process.env.SSH_USER,
    host: process.env.SSH_HOST,
    port: process.env.SSH_PORT,
    privateKey: fs.readFileSync(process.env.SSH_KEY_PATH),
    dstHost: '127.0.0.1',
    dstPort: process.env.DB2_PORT,
    localHost: '127.0.0.1',
    localPort: process.env.DB2_LOCAL_PORT || 5000
};

const db2Config = {
    host: '127.0.0.1',
    port: process.env.DB2_LOCAL_PORT || 5000,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASSWORD,
    database: process.env.DB2_NAME
};

let dbRemote;

tunnel(sshConfig, (error, server) => {
    if (error) {
        console.error('Error establishing SSH connection:', error);
        return;
    }

    console.log('SSH tunnel established successfully.');

    dbRemote = mysql.createConnection(db2Config);

    dbRemote.connect(err => {
        if (err) {
            console.error('Error connecting to the remote database:', err);
            return;
        }
        console.log('Connected to the remote database.');
    });
});

module.exports = dbRemote;

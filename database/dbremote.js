const mysql = require('mysql2');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const port = process.env.DB2_LOCAL_PORT || 5000;

const downloadSSHKey = async () => {
  try {
    const response = await axios.get(process.env.SSH_KEY_URL);
    const keyPath = '/tmp/gestionq';
    fs.writeFileSync(keyPath, response.data, { mode: 0o600 });
    return keyPath;
  } catch (error) {
    console.error('Error downloading SSH key:', error);
    throw error;
  }
};

const connectToDb = async () => {
  try {
    const keyPath = await downloadSSHKey();
    const sshOptions = {
      host: process.env.SSH_HOST,
      port: parseInt(process.env.SSH_PORT, 10),
      username: process.env.SSH_USER,
      privateKey: fs.readFileSync(keyPath)
    };

    const forwardOptions = {
      srcAddr: '127.0.0.1',
      srcPort: port,
      dstAddr: '127.0.0.1',
      dstPort: process.env.DB2_PORT || 3306
    };

    const tunnelOptions = {
      autoClose: true
    };

    const serverOptions = {
      port: port
    };

    const [tunnel] = await require('tunnel-ssh')(tunnelOptions, serverOptions, sshOptions, forwardOptions);
    console.log('SSH tunnel established successfully.');

    const dbRemote = mysql.createConnection({
      host: '127.0.0.1',
      port: port,
      user: process.env.DB2_USER,
      password: process.env.DB2_PASSWORD,
      database: process.env.DB2_NAME
    });

    dbRemote.on('error', (err) => {
      console.error('Database error:', err);
    });

    dbRemote.on('end', () => {
      console.log('Database connection closed.');
    });

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

const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Configura la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'seseq'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

// Obtener todas las solicitudes de cirugía
router.get('/', (req, res) => {
    db.query('SELECT * FROM solicitudes_cirugia', (err, results) => {
      if (err) {
        console.error('Error fetching solicitudes:', err);
        res.status(500).json({ error: 'Error fetching solicitudes' });
      } else {
        // **Set Content-Type header to 'application/json'**
        res.setHeader('Content-Type', 'application/json');
  
        // **Send JSON response**
        res.json(results);
      }
    });
  });
  
  // Crear una nueva solicitud de cirugía
  router.post('/', (req, res) => {
    const solicitud = req.body;
    db.query('INSERT INTO solicitudes_cirugia SET ?', solicitud, (err, result) => {
      if (err) {
        console.error('Error creating solicitud:', err);
        res.status(500).json({ error: 'Error creating solicitud' });
      } else {
        // **Set Content-Type header to 'application/json'**
        res.setHeader('Content-Type', 'application/json');
  
        // **Send JSON response**
        res.json(result);
      }
    });
  });
  
  module.exports = router;

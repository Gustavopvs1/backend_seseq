const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar la conexión a la base de datos local

// Ruta para obtener todos los procedimientos únicos
router.get('/', (req, res) => {
    db.query('SELECT DISTINCT diagnosticos_cie10 FROM solicitudes_cirugia', (err, results) => {
        if (err) {
            console.error('Error al obtener los procedimientos:', err);
            res.status(500).send('Error al obtener los procedimientos.');
        } else {
            res.json(results.map(row => row.diagnosticos_cie10));
        }
    });
});

module.exports = router;
